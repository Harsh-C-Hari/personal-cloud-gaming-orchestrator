from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials

from host_agent.jwt_manager import (
    jwt_manager,
)

security = HTTPBearer()

def get_current_user(
    credentials:
        HTTPAuthorizationCredentials
        = Depends(
            security
        ),
):
    token = credentials.credentials

    payload = (
        jwt_manager.verify_token(
            token
        )
    )

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid token.",
        )

    username = payload.get(
        "sub"
    )

    if username is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid token.",
        )

    return {
        "username": username,
        "role": payload.get(
            "role"
        ),
    }