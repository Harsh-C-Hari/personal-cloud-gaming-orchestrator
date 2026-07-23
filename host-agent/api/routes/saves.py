from fastapi import APIRouter, HTTPException
from api.dependencies import save_manager
from fastapi import Depends
from api.auth import get_current_user

router = APIRouter(
    prefix="/saves",
    tags=["saves"],
)


@router.get("/{game_id}")
def list_saves(
    game_id: str,
    current_user=Depends(
        get_current_user
    ),
):
    user_id = current_user["username"]
    
    try:
        return save_manager.list_user_saves(
            user_id=user_id,
            game_id=game_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

@router.delete("/{game_id}/{save_type}/{save_name}")
def delete_save(
    game_id: str,
    save_type: str,
    save_name: str,
    current_user=Depends(
        get_current_user
    ),
):
    user_id = current_user["username"]
    
    try:
        return save_manager.delete_user_save(
            user_id=user_id,
            game_id=game_id,
            save_type=save_type,
            save_name=save_name,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

@router.post("/{game_id}/force-unlock")
def force_unlock_save(
    game_id: str,
    current_user=Depends(
        get_current_user
    ),
):
    user_id = current_user["username"]
    
    try:

        save_root = save_manager._user_save_dir(
            user_id,
            game_id,
        )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    if not save_root.exists():
        return {
            "success": True,
            "message": "Save directory not found",
            "deleted": [],
        }

    lock_files = list(
        save_root.rglob("session.lock")
    )

    if not lock_files:
        return {
            "success": True,
            "message": "No lock file found",
            "deleted": [],
        }

    deleted = []

    for lock_file in lock_files:

        try:

            lock_file.unlink()

            deleted.append(
                str(lock_file)
            )

        except Exception as error:

            raise HTTPException(
                status_code=500,
                detail=(
                    f"Failed to delete "
                    f"{lock_file}: {error}"
                ),
            )

    return {
        "success": True,
        "message": "Stale lock cleared",
        "deleted": deleted,
    }