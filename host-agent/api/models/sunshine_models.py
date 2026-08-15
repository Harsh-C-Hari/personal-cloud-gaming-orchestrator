from pydantic import BaseModel


class StreamStartedRequest(BaseModel):
    app_name: str | None = None
    width: int = 0
    height: int = 0
    fps: int = 0
    hdr: bool = False
