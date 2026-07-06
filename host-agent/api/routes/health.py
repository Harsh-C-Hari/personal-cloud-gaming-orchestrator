from fastapi import APIRouter
from api.dependencies import save_manager

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check():
    return save_manager.health_check()