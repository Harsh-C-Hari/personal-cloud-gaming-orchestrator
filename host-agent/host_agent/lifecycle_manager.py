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

    def get_user_host_status(
        self,
        startup,
        sunshine,
        tailscale_connected,
        metrics,
        health,
        capabilities,
    ):
        from api.session_registry import (
            active_sessions,
            registry_lock,
        )

        with registry_lock:
            active_count = len(active_sessions)

        state = self.get_state(
            active_sessions=active_count,
            sunshine_running=sunshine["running"],
            sunshine_api_reachable=sunshine["reachable"],
            tailscale_connected=tailscale_connected,
            host_health=metrics["health"],
        )

        alerts = []

        ready = True
        reason = "Host Ready"
        reason_code = "ready"

        # Startup
        if not startup["startup_completed"]:
            ready = False
            reason = "Host startup not completed."
            reason_code = "startup"

            alerts.append({
                "severity": "critical",
                "code": "startup",
                "message": "Host startup has not completed."
            })

        # Maintenance
        if self.maintenance_mode:
            ready = False
            reason = "Host is in maintenance mode."
            reason_code = "maintenance"

            alerts.append({
                "severity": "critical",
                "code": "maintenance",
                "message": "Host is under maintenance."
            })

        # Recovery
        if self.recovery_required:
            ready = False
            reason = self.recovery_reason or "Recovery required."
            reason_code = "recovery"

            alerts.append({
                "severity": "critical",
                "code": "recovery",
                "message": self.recovery_reason or "Recovery mode enabled."
            })

        # Host health
        if metrics["health"] == "warning":
            alerts.append({
                "severity": "warning",
                "code": "host_warning",
                "message": "High CPU or RAM usage."
            })

        if metrics["health"] == "critical":
            ready = False
            reason = "Host health is critical."
            reason_code = "host_health"

            alerts.append({
                "severity": "critical",
                "code": "host_health",
                "message": "Host health is critical."
            })

        # Sunshine
        if not sunshine["running"]:
            alerts.append({
                "severity": "warning",
                "code": "sunshine",
                "message": "Sunshine is not running."
            })

        if not sunshine["reachable"]:
            alerts.append({
                "severity": "warning",
                "code": "sunshine_api",
                "message": "Sunshine API is not reachable."
            })

        if sunshine["app_count"] == 0:
            alerts.append({
                "severity": "warning",
                "code": "sunshine_apps",
                "message": "No Sunshine applications configured."
            })

        # Tailscale
        if not tailscale_connected:
            alerts.append({
                "severity": "warning",
                "code": "tailscale",
                "message": "Tailscale is offline."
            })

        return {
            "ready": ready,
            "reason": reason,
            "reason_code": reason_code,

            "host_state": state,

            "startup_completed": startup["startup_completed"],
            "startup_issues": startup["startup_issues"],

            "maintenance_mode": self.maintenance_mode,
            "recovery_required": self.recovery_required,
            "recovery_reason": self.recovery_reason,

            "active_session_count": active_count,

            "health": health,

            "alerts": alerts,

            "capabilities": {
                "gpu_available": capabilities["gpu_available"],
                "sunshine_running": sunshine["running"],
                "sunshine_api_reachable": sunshine["reachable"],
                "sunshine_apps_count": sunshine["app_count"],
                "sunshine_client_count": sunshine["client_count"],
                "tailscale_running": tailscale_connected,
            }
        }