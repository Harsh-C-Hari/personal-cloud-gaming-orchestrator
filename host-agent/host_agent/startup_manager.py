import time
from host_agent.logging_config import (
    configure_logger,
)

logger = configure_logger()


class StartupManager:

    def __init__(
        self,
        save_manager,
        sunshine_controller,
        tailscale_controller,
        host_monitor,
    ):
        self.save_manager = save_manager
        self.sunshine_controller = sunshine_controller
        self.tailscale_controller = tailscale_controller
        self.host_monitor = host_monitor
        self.startup_completed = False
        self.last_validation = None
        self.startup_issues = []

    def run(self):

        self.startup_completed = False
        self.startup_issues = []

        
        from api.services.session_service import (
            session_service,
        )
        logger.info(
            "Starting host initialization."
        )
        
        session_service.recover_sessions_on_startup()

        self.startup_issues = (
            self.validate_host()
        )
        
        logger.info(
            "Host initialization complete."
        )

        if self.startup_issues:

            logger.warning(
                f"Startup issues detected: "
                f"{', '.join(self.startup_issues)}"
            )

        else:

            logger.info(
                "No startup issues detected."
            )

        self.startup_completed = True

    def startup_status(self):

        return {
            "startup_completed":
                self.startup_completed,

            "startup_issues":
                self.startup_issues,

            "last_validation":
                self.last_validation,
        }

    def validate_host(self):

        issues = []

        sunshine = (
            self.sunshine_controller.status()
        )

        if not sunshine["configured"]:

            logger.warning(
                "Sunshine not configured."
            )

            issues.append(
                "Sunshine not configured"
            )

        elif sunshine["running"]:

            logger.info(
                "Sunshine available."
            )

        else:

            logger.warning(
                "Sunshine offline."
            )

            issues.append(
                "Sunshine offline"
            )

        if self.tailscale_controller.status():

            logger.info(
                "Tailscale connected."
            )

        else:

            logger.warning(
                "Tailscale offline."
            )

            issues.append(
                "Tailscale offline"
            )

        metrics = (
            self.host_monitor.get_metrics()
        )

        logger.info(
            f"Host health: {metrics['health']}"
        )

        if metrics["health"] == "critical":

            issues.append(
                "Host health critical"
            )

        self.last_validation = int(
            time.time()
        )
        
        return issues