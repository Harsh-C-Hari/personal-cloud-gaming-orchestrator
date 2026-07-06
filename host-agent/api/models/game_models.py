from pydantic import BaseModel


class SaveFiltersRequest(BaseModel):
    mode: str
    prefix: list[str]
    contains: list[str]
    suffix: list[str]


class GameCreateRequest(BaseModel):
    id: str
    name: str
    exe_name: str
    exe_path: str
    save_path: str
    process_name: str
    save_filters: SaveFiltersRequest

class GameUpdateRequest(BaseModel):
    name: str
    exe_name: str
    exe_path: str
    save_path: str
    process_name: str
    save_filters: SaveFiltersRequest

class GameValidationRequest(BaseModel):
    exe_path: str
    save_path: str
    process_name: str