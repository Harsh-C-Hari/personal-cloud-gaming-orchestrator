from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Depends

from api.models.auth_models import (
    LoginRequest,
)

from host_agent.user_manager import (
    user_manager,
)

from host_agent.jwt_manager import (
    jwt_manager,
)

from api.auth import (
    get_current_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post(
    "/login"
)
def login(
    request: LoginRequest,
):

    user = (
        user_manager
        .verify_credentials(
            request.username,
            request.password,
        )
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail=
                "Invalid credentials.",
        )

    token = (
        jwt_manager
        .create_access_token(
            {
                "sub":
                    user[
                        "username"
                    ],

                "role":
                    user[
                        "role"
                    ],
            }
        )
    )

    return {
        "access_token":
            token,

        "token_type":
            "bearer",

        "username":
            user[
                "username"
            ],

        "role":
            user[
                "role"
            ],
    }

@router.get(
    "/me"
)
def me(
    current_user=
        Depends(
            get_current_user
        ),
):

    return current_user