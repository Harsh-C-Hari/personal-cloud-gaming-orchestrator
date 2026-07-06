from host_agent.logging_config import (
    configure_logger,
)
from api.session_registry import (
    active_sessions,
    registry_lock,
)

logger = configure_logger()


class LifecycleManager:

    def __init__(
        self,
        startup_manager,
    ):
        self.startup_manager = (
            startup_manager
        )
        self.maintenance_mode = False
        self.recovery_required = False
        self.recovery_reason = None

    def get_state(
        self,
        active_sessions,
        sunshine_running,
        sunshine_api_reachable,
        tailscale_connected,
        host_health,
    ):

        startup = (
            self.startup_manager
            .startup_status()
        )

        if (
            not startup[
                "startup_completed"
            ]
        ):
            return "starting"

        if self.recovery_required:
            return "recovery"

        if self.maintenance_mode:
            return "maintenance"
        
        if active_sessions > 0:
            return "busy"

        if (not sunshine_running or not sunshine_api_reachable):
            return "degraded"

        if not tailscale_connected:
            return "degraded"

        if host_health == "critical":
            return "degraded"

        return "ready"

    def get_status(
        self,
        active_sessions,
        sunshine_running,
        sunshine_api_reachable,
        tailscale_connected,
        host_health,
    ):

        state = self.get_state(
            active_sessions,
            sunshine_running,
            sunshine_api_reachable,
            tailscale_connected,
            host_health,
        )

        return {
            "state": state,
            "maintenance_mode":
                self.maintenance_mode,
            "recovery_required":
                self.recovery_required,
            "recovery_reason":
                self.recovery_reason,
            "active_sessions":
                active_sessions,
        }

    def enable_maintenance(
        self,
        active_sessions,
    ):

        if active_sessions > 0:

            return False

        self.maintenance_mode = True

        return True

    def disable_maintenance(self):

        self.maintenance_mode = False

        logger.info(
            "Maintenance mode disabled."
        )

    def enable_recovery(self, reason="Unknown error"):

        self.recovery_required = True
        self.recovery_reason = reason

        logger.error(
            f"Recovery mode enabled: {reason}"
        )

    def disable_recovery(self):

        self.recovery_required = False
        self.recovery_reason = None

        logger.info(
            "Recovery mode disabled."
        )

    def current_host_state(self):

        from api.dependencies import (
            sunshine_controller,
            tailscale_controller,
            host_monitor,
        )

        from api.session_registry import (
            active_sessions,
            registry_lock,
        )

        with registry_lock:
            active_count = len(active_sessions)

        sunshine = sunshine_controller.status()

        metrics = host_monitor.get_metrics()

        return self.get_state(
            active_sessions=active_count,
            sunshine_running=sunshine["running"],
            sunshine_api_reachable=sunshine["reachable"],
            tailscale_connected=
                tailscale_controller.status(),
            host_health=
                metrics["health"],
        )
    
    def current_host_status(self):

        from api.dependencies import (
            sunshine_controller,
            tailscale_controller,
            host_monitor,
        )

        with registry_lock:
            active_count = len(active_sessions)

        sunshine = sunshine_controller.status()

        metrics = host_monitor.get_metrics()

        return self.get_status(
            active_sessions=active_count,
            sunshine_running=sunshine["running"],
            sunshine_api_reachable=sunshine["reachable"],
            tailscale_connected=
                tailscale_controller.status(),
            host_health=
                metrics["health"],
        )