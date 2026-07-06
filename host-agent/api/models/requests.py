from pydantic import BaseModel


class StartSessionRequest(BaseModel):

    user_id: str

    game_id: str

    duration: int = 60

    warning: int = 5

    load_save: str | None = None

    load_save_type: str | None = None
    
    load_save_name: str | None = None

    skip_timer: bool = False