from fastapi import APIRouter,HTTPException
from pathlib import Path
from fastapi import Depends
from fastapi.responses import FileResponse
from api.services.log_service import (
    read_logs,
    available_sessions,
)
from api.services.session_service import (
    session_service,
)
from api.auth import get_current_user

router = APIRouter()


@router.get("/logs")
def logs(
    level: str | None = None,
    session: str | None = None,
    search: str | None = None,
    limit: int = 200,
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    return read_logs(
        level,
        session,
        search,
        limit,
    )

@router.get(
    "/log-sessions"
)
def log_sessions(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    return {
        "sessions":
            available_sessions()
    }

@router.get("/my-logs")
def my_logs(
    level: str | None = None,
    session: str | None = None,
    search: str | None = None,
    limit: int = 200,
    current_user=Depends(
        get_current_user
    ),
):

    session_ids = session_service.get_user_session_ids(
        current_user["username"]
    )

    return read_logs(
        level=level,
        session=session,
        search=search,
        limit=limit,
        allowed_sessions=session_ids,
    )

@router.get("/my-log-sessions")
def my_log_sessions(
    current_user=Depends(
        get_current_user
    ),
):

    session_ids = session_service.get_user_session_ids(
        current_user["username"]
    )

    return {
        "sessions": available_sessions(
            allowed_sessions=session_ids,
        )
    }

@router.get(
    "/logs/download"
)
def download_logs(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    path = Path(
        "logs/host_agent.log"
    )

    if not path.exists():
        raise HTTPException(
            404,
            "Log file not found."
        )

    return FileResponse(
        path,
        filename="host_agent.log",
    )

@router.get("/my-logs/download")
def download_my_logs(
    current_user=Depends(
        get_current_user
    ),
):

    session_ids = (
        session_service.get_user_session_ids(
            current_user["username"]
        )
    )

    logs = read_logs(
        limit=1_000_000,
        allowed_sessions=session_ids,
    )["logs"]

    temp_path = Path(
        f"logs/{current_user['username']}_logs.log"
    )

    temp_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    temp_path.write_text(
        "\n".join(logs),
        encoding="utf-8",
    )

    return FileResponse(
        temp_path,
        filename="host_agent.log",
        media_type="text/plain",
    )