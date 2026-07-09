import os
import time
from fastapi import APIRouter

from fastapi.responses import JSONResponse
from api.session_registry import (
    active_sessions,
    registry_lock,
)

from api.dependencies import (
    host_monitor,
    sunshine_controller,
    tailscale_controller,
    startup_manager,
    lifecycle_manager,
    sunshine_watchdog,
    tailscale_watchdog,
    sunshine_stream_tracker,
)
from host_agent.recovery_event_manager import (
    get_recovery_events,
    get_recovery_stats,
)
from host_agent.logging_config import (
    configure_logger,
)
logger = configure_logger()

router = APIRouter(
    prefix="/host",
    tags=["host"],
)

@router.get("/status")
def get_host_status():
    with registry_lock:
        active_count = len(active_sessions)
    sunshine = sunshine_controller.status()

    metrics = host_monitor.get_metrics()

    tailscale_connected = (
        tailscale_controller.status()
    )

    host_ready = True
    host_ready_reason = "Ready"

    issues = []

    # Sunshine and Tailscale availability does not currently block local session execution.
    # Remote streaming features may require this validation in future phases.
    if False:    
        if not sunshine["configured"]:
            issues.append(
                "Sunshine is not Configured"
            )

        elif (
            not sunshine["running"]
            or not sunshine["reachable"]
        ):
            issues.append(
                "Sunshine Unavailable"
            )

        if not tailscale_connected:
            issues.append(
                "Tailsacle Unavaliable "
            )

    if metrics["health"] == "critical":
        issues.append(
            "Host health critical"
        )

    host_ready = len(issues) == 0
    host_ready_reason = (
        "Ready"
        if host_ready
        else ", ".join(issues)
    )

    startup = startup_manager.startup_status()

    lifecycle = lifecycle_manager.current_host_status()

    capabilities = host_monitor.get_capabilities()
    return JSONResponse(
        content={
            "startup_completed":startup["startup_completed"],
            "startup_issues": startup["startup_issues"],
            "last_validation": startup["last_validation"],
            "host_ready": host_ready,
            "host_ready_reason": host_ready_reason,
            "maintenance_mode": lifecycle["maintenance_mode"],
            "recovery_required": lifecycle["recovery_required"],
            "recovery_reason": lifecycle["recovery_reason"],
            "host_state": lifecycle["state"],
            "sunshine_running": sunshine["running"],
            "sunshine_can_stop": sunshine_controller.can_stop(),
            "sunshine_api_reachable": sunshine["reachable"],
            "sunshine_apps_count": sunshine["app_count"],
            "sunshine_client_count": sunshine["client_count"],
            "sunshine_error": sunshine["error"],
            "sunshine_apps_error": sunshine["error"],
            "tailscale_running": tailscale_connected,
            "gpu_available": capabilities["gpu_available"],
            "disk_free_gb": metrics["disk_free_gb"],
            "active_session_count": active_count,
        },
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/metrics")
def get_host_metrics():

    return JSONResponse(
        content=host_monitor.get_metrics(),
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.post("/sunshine/start")
def start_sunshine():
    return sunshine_controller.start()

@router.post("/sunshine/stop")
def stop_sunshine():
    return sunshine_controller.stop()

@router.post("/sunshine/restart")
def restart_sunshine():
    return sunshine_controller.restart()

@router.post(
    "/maintenance/enable"
)
def enable_maintenance():

    with registry_lock:
        active_count = len(active_sessions)

    success = (
        lifecycle_manager
        .enable_maintenance(
            active_count
        )
    )

    return {
        "success": success,
        "maintenance_mode":
            lifecycle_manager
            .maintenance_mode,
    }

@router.post(
    "/maintenance/disable"
)
def disable_maintenance():

    lifecycle_manager.disable_maintenance()

    return {
        "success": True,
        "maintenance_mode": False,
    }

@router.post(
    "/recovery/enable"
)
def enable_recovery():

    lifecycle_manager.enable_recovery()

    return {
        "success": True,
        "recovery_required": True,
    }

@router.post(
    "/recovery/disable"
)
def disable_recovery():

    lifecycle_manager.disable_recovery()

    return {
        "success": True,
        "recovery_required": False,
    }

@router.post(
    "/revalidate"
)
def revalidate_host():

    startup_manager.startup_issues = (
        startup_manager.validate_host()
    )

    return {
        "success": True,
        "issues":
            startup_manager.startup_issues,
    }

@router.get("/recovery-events")
def recovery_events(limit: int = 50):

    events = get_recovery_events(limit)

    return JSONResponse(
        content={
            "count": len(events),
            "events": events,
        },
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get(
    "/recovery-stats"
)
def recovery_stats():

    
    return JSONResponse(
        content=get_recovery_stats(),
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get(
    "/watchdogs"
)
def get_watchdogs():
    return {
        "sunshine":
            sunshine_watchdog.status(),
        "tailscale":
            tailscale_watchdog.status(),
    }

@router.get("/debug")
def debug():

    return {
        "pid": os.getpid(),
        "time": time.time(),
    }
@router.get(
    "/tailscale/status"
)
def tailscale_status():

    return (
        tailscale_controller
        .detailed_status()
    )

@router.post(
    "/sunshine/pair"
)
def pair_sunshine_client(
    pin: str,
):
    return (
        sunshine_controller
        .pair_client(pin)
    )

@router.post(
    "/sunshine/unpair"
)
def unpair_sunshine_client(
    uuid: str,
):
    return (
        sunshine_controller
        .unpair_client(uuid)
    )

@router.post(
    "/sunshine/unpair-all"
)
def unpair_all_sunshine_clients():
    return (
        sunshine_controller
        .unpair_all_clients()
    )

@router.get("/sunshine/clients")
def get_sunshine_clients_route():
    return sunshine_controller.get_clients()

@router.get(
    "/sunshine/stream"
)
def sunshine_stream_status():

    return JSONResponse(
        content=
            sunshine_stream_tracker.get_state(),
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )