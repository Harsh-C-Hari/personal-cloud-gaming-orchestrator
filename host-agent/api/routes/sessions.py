from fastapi import APIRouter
import re
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from api.models.requests import (
    StartSessionRequest,
)

from api.models.responses import (
    SessionStartResponse,
    ActiveSessionsResponse,
    ActiveSessionItem,
    SessionStopResponse,
    SessionStatusResponse,
)

from api.dependencies import (
    host_monitor,
    lifecycle_manager,
    sunshine_controller,
    save_manager,
)

from api.services.session_service import (
    session_service,
)


from api.services.sunshine_service import (
    is_sunshine_process_running,
)
from host_agent.logging_config import (
    configure_logger,
)
logger = configure_logger()

USER_ID_PATTERN = re.compile(
    r"^[a-zA-Z0-9_-]+$"
)

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"]
)


@router.post(
    "/start",
    response_model=SessionStartResponse,
)
def start_session(
    request: StartSessionRequest,
):
    save_manager.reload_game_configs()
    try:

        sunshine = sunshine_controller.status()

        # Sunshine and Tailscale availability does not currently block local session execution.
        # Remote streaming features may require this validation in future phases.
        if not sunshine["configured"]:
            logger.warning(
                "Sunshine not configured. Remote streaming unavailable."
            )

        elif not is_sunshine_process_running():
            logger.warning(
                "Sunshine is not running. Remote streaming unavailable."
            )

        capabilities = host_monitor.get_capabilities()
        if not capabilities["gpu_available"]:
            raise HTTPException(
                status_code=400,
                detail="Cannot launch: GPU is not available.",
            )
        
        metrics = host_monitor.get_metrics()
        
        if metrics["health"] == "critical":
            raise HTTPException(
                status_code=400,
                detail="Cannot launch: Host Health Critical.",
            )
        
        state = lifecycle_manager.current_host_state()

        if state in ["starting", "maintenance", "recovery"]:
            
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Host not accepting sessions "
                    f"({state})"
                ),
            )
        
        if not USER_ID_PATTERN.match(
            request.user_id
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Invalid user_id. "
                    "Only letters, numbers, hyphens and underscores are allowed."
                ),
            )
        
        session_id = (
            session_service.start_session(
                request
            )
        )

        return SessionStartResponse(
            success=True,
            session_id=session_id,
            message="Session started",
        )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

@router.get(
    "/active",
    response_model=ActiveSessionsResponse,
)
def get_active_sessions():

    sessions = (
        session_service.get_active_sessions()
    )

    return ActiveSessionsResponse(
        sessions=[
            ActiveSessionItem(**session)
            for session in sessions
        ]
    )

@router.get("/history")
def get_session_history(
    limit: int = 20,
):
    
    return JSONResponse(
        content={
            "history": session_service.get_session_history(
                limit=limit,
            )
        },
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/events")
def get_session_events(
    limit: int = 50,
    session_id: str | None = None,
):
    return JSONResponse(
        content={
            "events": session_service.get_session_events(
                limit=limit,
                session_id=session_id,
            )
        },
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/analytics")
def get_session_analytics():
    
    return JSONResponse(
        content=session_service.get_session_analytics(),
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/health")
def get_session_health():
    return session_service.get_session_health()

# DEV ONLY:
# Forcefully removes session lock if a stale lock blocks testing.
# Protect with admin auth before production use.
@router.post("/unlock")
def force_unlock_session():
    return session_service.force_unlock_session()

@router.get(
    "/{session_id}",
    response_model=SessionStatusResponse,
)
def get_session_status(
    session_id: str,
):

    try:

        session = (
            session_service.get_session_status(
                session_id
            )
        )

        return SessionStatusResponse(
            **session
        )

    except Exception as error:

        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

@router.post(
    "/{session_id}/stop",
    response_model=SessionStopResponse,
)
def stop_session(
    session_id: str,
):

    try:

        session_service.stop_session(
            session_id
        )

        return SessionStopResponse(
            success=True,
            message="Session stopped",
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )