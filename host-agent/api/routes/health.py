from fastapi import APIRouter
from api.dependencies import save_manager
from fastapi import Depends
from fastapi import HTTPException
from api.auth import get_current_user
router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check(
    current_user=Depends(
        get_current_user
    ),
):
    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    return save_manager.health_check()