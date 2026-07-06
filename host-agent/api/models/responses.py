from pydantic import BaseModel


class SessionStartResponse(BaseModel):

    success: bool

    session_id: str

    message: str

class ActiveSessionItem(BaseModel):

    session_id: str

    user_id: str

    game_id: str

    status: str

    started_at: float | None = None
    
    ended_at: float | None = None
    
    played_seconds: float | None = None
    
    error: str | None = None

    game_ended_at: float | None = None


class ActiveSessionsResponse(BaseModel):

    sessions: list[ActiveSessionItem]


class SessionStopResponse(BaseModel):

    success: bool

    message: str

class SessionStatusResponse(BaseModel):

    session_id: str

    user_id: str

    game_id: str

    status: str

    remaining_minutes: float | None

    warning_sent: bool

    error: str | None = None

    started_at: float | None = None
    
    ended_at: float | None = None
    
    played_seconds: float | None = None

    game_ended_at: float | None = None