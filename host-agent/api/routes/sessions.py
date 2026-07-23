from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from fastapi import Depends

from api.models.requests import (
    StartSessionRequest,
)
from api.auth import get_current_user

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
    current_user=Depends(
        get_current_user
    ),
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
        
        session_id = (
            session_service.start_session(
                request=request,
                user_id=current_user["username"],
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
def get_active_sessions(
    current_user=Depends(
        get_current_user
    ),
):

    sessions = session_service.get_active_sessions()

    return ActiveSessionsResponse(
        sessions=[
            ActiveSessionItem(**session)
            for session in sessions
        ]
    )

@router.get("/history")
def get_session_history(
    limit: int = 20,
    current_user=Depends(
        get_current_user
    ),
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
    current_user=Depends(
        get_current_user
    ),
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
def get_session_analytics(
    current_user=Depends(
        get_current_user
    ),
):
    
    return JSONResponse(
        content=session_service.get_session_analytics(),
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/my-history")
def get_my_session_history(
    limit: int = 20,
    current_user=Depends(
        get_current_user
    ),
):

    return JSONResponse(
        content={
            "history": session_service.get_session_history(
                limit=limit,
                user_id=current_user["username"],
            )
        },
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/my-events")
def get_my_session_events(
    limit: int = 50,
    session_id: str | None = None,
    current_user=Depends(
        get_current_user
    ),
):

    return JSONResponse(
        content={
            "events": session_service.get_session_events(
                limit=limit,
                session_id=session_id,
                user_id=current_user["username"],
            )
        },
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/my-analytics")
def get_my_session_analytics(
    current_user=Depends(
        get_current_user
    ),
):

    return JSONResponse(
        content=session_service.get_session_analytics(
            user_id=current_user["username"],
        ),
        headers={
            "Cache-Control":
                "no-store, no-cache, must-revalidate"
        },
    )

@router.get("/health")
def get_session_health(
    current_user=Depends(
        get_current_user
    ),
):
    return session_service.get_session_health()

# DEV ONLY:
# Forcefully removes session lock if a stale lock blocks testing.
# Protect with admin auth before production use.
@router.post("/unlock")
def force_unlock_session(
    current_user=Depends(
        get_current_user
    ),
):
    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    return session_service.force_unlock_session()

@router.get(
    "/{session_id}",
    response_model=SessionStatusResponse,
)
def get_session_status(
    session_id: str,
    current_user=Depends(
        get_current_user
    ),
):

    try:

        session = session_service.get_session_status(
            session_id
        )

        return SessionStatusResponse(
            **session
        )

    except HTTPException:
        raise

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
    current_user=Depends(
        get_current_user
    ),
):

    try:

        session = session_service.get_session(
            session_id
        )

        if (
            current_user["role"] != "admin"
            and
            session["user_id"] != current_user["username"]
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this session.",
            )

        session_service.stop_session(
            session_id
        )

        return SessionStopResponse(
            success=True,
            message="Session stopped",
        )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

@router.post(
    "/{session_id}/restart"
)
def restart_session(
    session_id: str,
    current_user=Depends(
        get_current_user
    ),
):

    try:
        
        session = session_service.get_session(
            session_id
        )

        if (
            current_user["role"] != "admin"
            and
            session["user_id"] != current_user["username"]
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this session.",
            )

        restart_user = (
            session["user_id"]
            if current_user["role"] == "admin"
            else current_user["username"]
        )

        session_service.restart_session(
            session_id,
            restart_user,
        )

        return {
            "success": True,
            "message":
                "Game restart requested.",
        }

    except HTTPException:
        raise

    except ValueError as error:

        raise HTTPException(
            status_code=409,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )