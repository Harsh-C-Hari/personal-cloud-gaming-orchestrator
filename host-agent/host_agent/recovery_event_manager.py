import time
import asyncio
import threading

from host_agent.logging_config import (
    configure_logger,
)
from host_agent.repositories.recovery_repository import (
    recovery_repository,
)
logger = configure_logger()

# Serializes the whole insert -> broadcast sequence below. Without this,
# two threads (e.g. sunshine_watchdog and tailscale_watchdog firing close
# together) can interleave: thread B's insert+broadcast can complete and
# reach the wire before thread A's, even though A inserted first, because
# nothing enforces that each asyncio.run() call finishes send-order
# matches insertion order. That shows up as recovery_event messages
# arriving out of id order, and recovery_stats_update occasionally
# showing a stale (lower) snapshot arriving after a fresher one.
_broadcast_lock = threading.Lock()


def get_recovery_events(
    limit=100,
):

    return recovery_repository.get_events(
        limit=limit,
    )

def get_recovery_stats():

    events = get_recovery_events(
        limit=10000
    )

    stats = {
        "sunshine_restarts": 0,
        "sunshine_failures": 0,

        "tailscale_failures": 0,
        "tailscale_recoveries": 0,

        "tailscale_service_recoveries": 0,
        "tailscale_ipn_recoveries": 0,
        "tailscale_up_recoveries": 0,

        "tailscale_nostate": 0,
        "tailscale_stopped": 0,
        "tailscale_service_stopped": 0,
        "tailscale_ipn_missing": 0,
    }

    for event in events:

        if (
            event["service"]
            == "sunshine"
        ):

            if (
                event["event"]
                == "restart_success"
            ):
                stats[
                    "sunshine_restarts"
                ] += 1

            elif (
                event["event"]
                == "restart_failed"
            ):
                stats[
                    "sunshine_failures"
                ] += 1

        elif (
            event["service"]
            == "tailscale"
        ):

            event_name = event["event"]

            if event_name == "recovered":
                stats["tailscale_recoveries"] += 1

            elif event_name == "recovery_started_service":
                stats["tailscale_service_recoveries"] += 1

            elif event_name == "recovery_started_ipn":
                stats["tailscale_ipn_recoveries"] += 1

            elif event_name == "recovery_started_up":
                stats["tailscale_up_recoveries"] += 1

            elif event_name == "detected_nostate":
                stats["tailscale_nostate"] += 1
                stats["tailscale_failures"] += 1

            elif event_name == "detected_stopped":
                stats["tailscale_stopped"] += 1
                stats["tailscale_failures"] += 1

            elif event_name == "failure_mode_changed":

                mode = (
                    event.get(
                        "details",
                        {},
                    ).get(
                        "to"
                    )
                )

                if mode == "SERVICE_STOPPED":
                    stats["tailscale_service_stopped"] += 1

                elif mode == "IPN_MISSING":
                    stats["tailscale_ipn_missing"] += 1

    return stats

def append_recovery_event(
    service,
    event,
    details=None,
):

    with _broadcast_lock:

        event_time = time.time()

        event_id = recovery_repository.append_event(
            event_time=event_time,
            service=service,
            event=event,
            details=details,
        )

        # Lazy import to avoid a circular import between host_agent (this
        # module) and api (websocket_manager). Broadcast the new event plus
        # freshly recomputed stats so the dashboard updates immediately
        # instead of waiting on its next poll. Field names here intentionally
        # match get_recovery_events()'s REST shape (id/time/service/event/
        # details) so frontend code can treat WS and REST payloads the same.
        try:

            from api.websocket_manager import (
                websocket_manager,
            )

            asyncio.run(
                websocket_manager.broadcast(
                    {
                        "type": "recovery_event",
                        "event": {
                            "id": event_id,
                            "time": event_time,
                            "service": service,
                            "event": event,
                            "details": details,
                        },
                    }
                )
            )

            asyncio.run(
                websocket_manager.broadcast(
                    {
                        "type": "recovery_stats_update",
                        "stats": get_recovery_stats(),
                    }
                )
            )

        except Exception as error:

            logger.warning(
                f"Failed to broadcast recovery event: {error}"
            )