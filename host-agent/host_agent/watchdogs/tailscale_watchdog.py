import threading
import time
from host_agent.logging_config import (
    configure_logger,
)
from host_agent.recovery_event_manager import (
    append_recovery_event,
)
from host_agent.tailscale_controller import (
    TailscaleController
)

logger = configure_logger()

class TailscaleWatchdog:

    def __init__(self):

        self.tailscale_controller = TailscaleController()
        self.running = False
        self.last_recovery_attempt = 0
        self.recovery_cooldown = 300
        self.current_failure_mode = None
        self.failure_start_time = None
        self.last_backend_state = None
        self.last_health_state = None
        self.outage_started = None
        self.last_recovery_method = None

    def start(self):

        if self.running:
            return

        self.running = True

        threading.Thread(
            target=self._loop,
            daemon=True,
        ).start()

    def _loop(self):

        while self.running:

            try:

                status = (
                    self.tailscale_controller
                    .detailed_status()
                )

                backend_state = status.get(
                    "backend_state",
                    "Unknown",
                )

                failure_mode = self.failure_mode(status)

                if failure_mode != self.current_failure_mode:

                    logger.info(
                        f"Failure mode changed: "
                        f"{self.current_failure_mode} -> "
                        f"{failure_mode}"
                    )

                    if failure_mode is not None:

                        self.failure_start_time = (
                            time.time()
                        )

                        append_recovery_event(
                            "tailscale",
                            "failure_mode_changed",
                            {
                                "from":
                                    self.current_failure_mode,
                                "to":
                                    failure_mode,
                            },
                        )

                    else:

                        self.failure_start_time = None

                    self.current_failure_mode = (
                        failure_mode
                    )
                
                health = status.get(
                    "health",
                    [],
                )

                if self.last_backend_state is None:

                    self.last_backend_state = (
                        backend_state.lower()
                    )

                    if backend_state.lower() != "running":

                        append_recovery_event(
                            "tailscale",
                            "initial_state",
                            {
                                "state":
                                    backend_state,
                            },
                        )

                    time.sleep(30)
                    continue

                if health != self.last_health_state and self.last_backend_state is not None:

                    if health:

                        append_recovery_event(
                            "tailscale",
                            "health_warning",
                            {
                                "messages":
                                    health,
                            },
                        )

                    else:

                        append_recovery_event(
                            "tailscale",
                            "health_cleared",
                        )

                    self.last_health_state = (
                        health
                    )
                
                if ( self.last_backend_state != None ) and ( backend_state.lower() != self.last_backend_state ) :

                    logger.info(
                        f"Tailscale state changed: "
                        f"{self.last_backend_state} -> "
                        f"{backend_state.lower()}"
                    )

                    append_recovery_event(
                        "tailscale",
                        "state_changed",
                        {
                            "from":
                                self.last_backend_state,
                            "to":
                                backend_state.lower(),
                            "authenticated": status.get("user_authenticated", False),
                            "ips": status.get("tailscale_ips"),
                        },
                    )
                    if backend_state.lower() == "running":

                        duration = self.outage_duration()
                        
                        append_recovery_event(
                            "tailscale",
                            "recovered",
                            {
                                "downtime_seconds":
                                    duration,
                                "method":
                                    self.last_recovery_method,
                            },
                        )
                        self.last_recovery_method = None

                    else:

                        if self.outage_started is None:

                            self.outage_started = (
                                time.time()
                            )
                        
                        append_recovery_event(
                            "tailscale",
                            "failure_detected",
                            {
                                "failure_mode":
                                    failure_mode,
                            }
                        )

                    self.last_backend_state = (
                        backend_state.lower()
                    )
                
                if (
                    self.current_failure_mode
                    == "IPN_MISSING"
                    and
                    self.failure_duration()
                    >= 90
                    and
                    self.can_attempt_recovery()
                    and
                    self.tailscale_controller.configured()
                ):
                    self.last_recovery_method = "ipn"
                    logger.warning(
                        "Tailscale ipn recovery triggered "
                    )
                    
                    append_recovery_event(
                        "tailscale",
                        "recovery_attempt_ipn",
                        {
                            "failure_mode":
                                self.current_failure_mode,

                            "failure_duration":
                                self.failure_duration(),
                        },
                    )

                    success = (
                        self.tailscale_controller
                        .start_ipn()
                    )

                    if success:

                        self.last_recovery_attempt = time.time()

                        logger.info(
                            "Tailscale Recovered ipn"
                        )
                        append_recovery_event(
                            "tailscale",
                            "recovery_started_ipn",
                        )

                    else:
                        
                        logger.info(
                            "Tailscale ipn Recover Failed"
                        )
                        
                        append_recovery_event(
                            "tailscale",
                            "recovery_failed_ipn",
                        )

                if (
                    self.current_failure_mode
                    == "SERVICE_STOPPED"
                    and
                    self.failure_duration()
                    >= 60
                    and
                    self.can_attempt_recovery()
                ):
                    self.last_recovery_method = "service"

                    logger.warning(
                        "Tailscale service recovery triggered "
                    )
                    
                    append_recovery_event(
                        "tailscale",
                        "recovery_attempt_service",
                        {
                            "failure_mode":
                                self.current_failure_mode,

                            "failure_duration":
                                self.failure_duration(),
                        },
                    )

                    success = (
                        self.tailscale_controller
                        .start_service()
                    )

                    if success:

                        self.last_recovery_attempt = time.time()

                        logger.info(
                            "Tailscale Recovered Service"
                        )
                        append_recovery_event(
                            "tailscale",
                            "recovery_started_service",
                        )

                    else:
                        
                        logger.info(
                            "Tailscale Service Recover Failed"
                        )
                        
                        append_recovery_event(
                            "tailscale",
                            "recovery_failed_service",
                        )

                if (
                    self.current_failure_mode
                    == "TAILSCALE_DOWN"
                    and
                    self.failure_duration()
                    >= 30
                    and
                    self.can_attempt_recovery()
                ):
                    self.last_recovery_method = "up"

                    logger.warning(
                        "Tailscale up recovery triggered "
                    )
                    
                    append_recovery_event(
                        "tailscale",
                        "recovery_attempt_up",
                        {
                            "failure_mode":
                                self.current_failure_mode,

                            "failure_duration":
                                self.failure_duration(),
                        },
                    )

                    success = (
                        self.tailscale_controller
                        .up()
                    )

                    if success:

                        self.last_recovery_attempt = time.time()

                        logger.info(
                            "Tailscale Recovered Up"
                        )
                        append_recovery_event(
                            "tailscale",
                            "recovery_started_up",
                        )

                    else:
                        
                        logger.info(
                            "Tailscale Up Recover Failed"
                        )
                        
                        append_recovery_event(
                            "tailscale",
                            "recovery_failed_up",
                        )

            except Exception as error:

                logger.error(
                    f"Tailscale watchdog error: {error}"
                )

            time.sleep(30)

    def status(self):

        return {
            "running":
                self.running,

            "last_backend_state":
                self.last_backend_state,

            "outage_started":
                self.outage_started,
        }

    def can_attempt_recovery(self):

        return (
            time.time()
            -
            self.last_recovery_attempt
        ) > self.recovery_cooldown
    
    def failure_mode(self, status):
        
        if (
            not status.get("service_running", False)
        ):
            return "SERVICE_STOPPED"
        
        if (
            status.get("service_running", False)
            and
            not status.get("ipn_running", False)
        ):
            return "IPN_MISSING"

        if (
            status.get("backend_state", False)
            == "Stopped"
        ):
            return "TAILSCALE_DOWN"

        if (
            status.get("backend_state", False)
            == "NoState"
        ):
            return "NO_STATE"

        if (
            status.get("backend_state", False)
            == "Unknown"
        ):
            return "SERVICE_UNAVAILABLE"

        return None

    def outage_duration(self):
        
        duration = None

        if self.outage_started:

            duration = int(
                time.time()
                -
                self.outage_started
            )

            self.outage_started = None

            return duration

        return None

    def failure_duration(self):

        if self.failure_start_time is None:
            return 0

        return int(
            time.time()
            -
            self.failure_start_time
        )