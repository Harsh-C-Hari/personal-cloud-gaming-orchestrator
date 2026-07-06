import json
import re
import os
import threading
from fastapi import APIRouter, HTTPException
from api.dependencies import save_manager
from pathlib import Path
from api.models.game_models import (
    GameCreateRequest,
    GameUpdateRequest,
    GameValidationRequest
)
from host_agent.logging_config import (
    configure_logger,
)
from host_agent.config_manager import config_manager
from api.services.session_service import (
    session_service,
)

router = APIRouter(prefix="/games", tags=["games"])

logger = configure_logger()
games_config_lock = threading.RLock()

GAMES_PATH = Path(
    config_manager.get(
        "storage",
        "games_config_path"
    )
)

def read_games_json():

    with GAMES_PATH.open(
        "r",
        encoding="utf-8",
    ) as file:

        return json.load(file)


def write_games_json(data):

    temp_path = GAMES_PATH.with_suffix(
        ".tmp"
    )

    with temp_path.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            data,
            file,
            indent=4,
            ensure_ascii=False,
        )

        file.flush()

        os.fsync(
            file.fileno()
        )

    temp_path.replace(
        GAMES_PATH
    )

def validate_game_configuration(
    game_id: str,
    game,
) -> None:

    if not re.match(
        r"^[a-z0-9_]+$",
        game_id,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Game ID must contain only "
                "lowercase letters, numbers, "
                "and underscores."
            ),
        )

    required_fields = [
        "name",
        "exe_name",
        "exe_path",
        "save_path",
        "process_name",
    ]

    for field in required_fields:

        value = getattr(
            game,
            field,
        )

        if (
            not isinstance(value, str)
            or not value.strip()
        ):
            raise HTTPException(
                status_code=400,
                detail=f"{field} is required.",
            )

    save_filters = game.save_filters

    if save_filters is None:
        raise HTTPException(
            status_code=400,
            detail="save_filters is required.",
        )

    if save_filters.mode not in [
        "or",
        "and",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Save filter mode must be "
                "OR or AND."
            ),
        )

    for key in [
        "prefix",
        "contains",
        "suffix",
    ]:

        value = getattr(
            save_filters,
            key,
        )

        if not isinstance(
            value,
            list,
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"save_filters.{key} "
                    "must be a list."
                ),
            )

def ensure_game_not_active(
    game_id: str,
) -> None:

    active_sessions = session_service.get_active_sessions()
    for session in active_sessions:

        if session["game_id"] == game_id:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot modify game "
                    "configuration while "
                    "a session is active."
                ),
            )

def compare_configs(
    old: dict,
    new: dict,
    prefix: str = "",
) -> list[str]:

    changes = []

    for key, new_value in new.items():

        path = (
            f"{prefix}.{key}"
            if prefix
            else key
        )

        old_value = old.get(key)

        if (
            isinstance(old_value, dict)
            and isinstance(new_value, dict)
        ):
            changes.extend(
                compare_configs(
                    old_value,
                    new_value,
                    path,
                )
            )

        elif old_value != new_value:

            changes.append(
                f"{path}: "
                f"{old_value} -> {new_value}"
            )

    return changes

@router.post("/")
def add_game(
    game: GameCreateRequest,
):

    with games_config_lock:
    
        data = read_games_json()

        games = data.get(
            "games",
            {},
        )

        if not game.id:
            raise HTTPException(
                status_code=400,
                detail="Game ID is required.",
            )


        validate_game_configuration(
            game.id,
            game,
        )


        if game.id in games:
            raise HTTPException(
                status_code=400,
                detail="Game ID already exists.",
            )
        
        games[game.id] = game.model_dump()

        write_games_json(data)

    save_manager.reload_game_configs()

    logger.info(
        "Game configuration added: "
        f"{game.id} ({game.name})"
    )

    return {
        "success": True,
        "message": (
            "Game added successfully"
        ),
        "game_id": game.id,
    }

@router.put("/{game_id}")
def update_game(
    game_id: str,
    game: GameUpdateRequest,
):

    ensure_game_not_active(
        game_id
    )
    
    with games_config_lock:
    
        data = read_games_json()

        games = data.get(
            "games",
            {},
        )

        if game_id not in games:

            raise HTTPException(
                status_code=404,
                detail="Game not found",
            )

        validate_game_configuration(
            game_id,
            game,
        )
        
        old_game = games[game_id].copy()
        
        new_game = game.model_dump()
        
        changes = compare_configs(
            old_game,
            new_game,
        )
        
        games[game_id].update(new_game)

        write_games_json(
            data
        )

    save_manager.reload_game_configs()

    if changes:
        logger.info(
            "Game configuration updated: "
            f"{game_id}\n"
            + "\n".join(changes)
        )

    return {
        "success": True,
        "message": (
            "Game updated successfully"
        ),
        "game_id": game_id,
    }

@router.delete("/{game_id}")
def delete_game(
    game_id: str,
):

    ensure_game_not_active(
        game_id
    )
    
    with games_config_lock:
    
        data = read_games_json()

        games = data.get(
            "games",
            {},
        )

        if game_id not in games:

            raise HTTPException(
                status_code=404,
                detail="Game not found",
            )
        
        deleted_game = games[game_id].copy()

        del games[game_id]

        write_games_json(
            data
        )

    save_manager.reload_game_configs()

    logger.warning(
        "Game configuration deleted: "
        f"{game_id} "
        f"({deleted_game['name']})"
    )
    
    return {
        "success": True,
        "message": (
            "Game deleted successfully"
        ),
        "game_id": game_id,
    }

@router.get("/list_games")
def list_games():
    return save_manager.game_configs


@router.get("/{game_id}/validate")
def validate_game(
    game_id: str,
):
    game_configs = save_manager.game_configs

    if game_id not in game_configs:
        raise HTTPException(
            status_code=404,
            detail="Game config not found",
        )

    config = game_configs[game_id]
    exe_path = config.exe_path
    save_path = config.save_path
    process_name = config.process_name

    checks = {
        "exe_exists": bool(exe_path)
        and Path(exe_path).exists(),

        "save_path_exists": bool(save_path)
        and Path(save_path).exists(),

        "process_name_set": bool(process_name),
    }

    errors = []

    if not checks["exe_exists"]:
        errors.append("Game EXE path does not exist.")

    if not checks["save_path_exists"]:
        errors.append("Save path does not exist.")

    if not checks["process_name_set"]:
        errors.append("Process name is not configured.")

    return {
        "game_id": game_id,
        "valid": len(errors) == 0,
        "checks": checks,
        "errors": errors,
    }

@router.get("/reload")
def reload_game_config():
    return save_manager.reload_game_configs()

@router.post("/validate")
def validate_game_config(
    request: GameValidationRequest,
):
    errors = []

    if not Path(request.exe_path).exists():
        errors.append(
            "Game EXE path does not exist."
        )

    if not Path(request.save_path).exists():
        errors.append(
            "Save path does not exist."
        )

    if not request.process_name.strip():
        errors.append(
            "Process name is not configured."
        )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }