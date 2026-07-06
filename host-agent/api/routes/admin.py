from fastapi import APIRouter,HTTPException
from pathlib import Path
from fastapi.responses import FileResponse
from api.services.log_service import (
    read_logs,
    available_sessions,
)

router = APIRouter()


@router.get("/logs")
def logs(
    level: str | None = None,
    session: str | None = None,
    search: str | None = None,
    limit: int = 200,
):

    return read_logs(
        level,
        session,
        search,
        limit,
    )

@router.get(
    "/log-sessions"
)
def log_sessions():

    return {
        "sessions":
            available_sessions()
    }

@router.get(
    "/logs/download"
)
def download_logs():

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