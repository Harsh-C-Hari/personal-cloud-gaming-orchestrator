import time
import json
import os
from pathlib import Path
from host_agent.logging_config import (
    configure_logger,
)
logger = configure_logger()


def get_recovery_events(
    limit=100,
):

    recovery_path = Path(
        "data/recovery_events.json"
    )

    events = _safe_read_json(
        recovery_path,
        [],
    )

    return list(
        reversed(events[-limit:])
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

    recovery_path = Path("data/recovery_events.json")
    recovery_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    record = {
        "time": time.time(),
        "service": service,
        "event": event,
        "details": details,
    }

    recovery = _safe_read_json(
        recovery_path,
        [],
    )

    recovery.append(record)
    
    recovery = recovery[-1000:]

    _safe_write_json(
        path = recovery_path,
        data = recovery,
    )

def _safe_write_json(
    path,
    data,
) -> None:

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_path = path.with_suffix(
        path.suffix + ".tmp"
    )

    last_error = None

    for _ in range(5):

        try:
            with temp_path.open(
                "w",
                encoding="utf-8",
            ) as file:
                json.dump(
                    data,
                    file,
                    indent=2,
                    ensure_ascii=False,
                )

                file.flush()
                os.fsync(file.fileno())

            temp_path.replace(path)
            return

        except PermissionError as error:
            last_error = error
            time.sleep(0.2)

        except Exception as error:
            logger.error(
                f"Failed to write JSON file {path}: {error}"
            )
            return

    logger.error(
        f"Failed to write JSON file {path} after retries: {last_error}"
    )

def _safe_read_json(
    path,
    default,
):

    try:

        if not path.exists():
            return default

        with path.open(
            "r",
            encoding="utf-8",
        ) as file:

            return json.load(file)

    except Exception:

        return default