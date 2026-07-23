from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Depends

from api.models.auth_models import (
    LoginRequest,
    CreateUserRequest,
    ChangePasswordRequest,
    BootstrapAdminRequest,
)

from host_agent.user_manager import (
    user_manager,
)

from host_agent.auth_manager import (
    auth_manager,
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

@router.post(
    "/bootstrap-admin"
)
def bootstrap_admin(
    request: BootstrapAdminRequest,
):

    if not user_manager.bootstrap_required():

        raise HTTPException(
            status_code=403,
            detail=
                "Bootstrap already completed.",
        )

    password_hash = (
        auth_manager.hash_password(
            request.password
        )
    )
    
    try:

        user_manager.create_user(
            username=request.username,
            password_hash=password_hash,
            role="admin",
        )

    except RuntimeError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return {
        "success": True,
        "message":
            "Initial admin account created.",
    }

@router.get(
    "/bootstrap-required"
)
def bootstrap_required():

    return {
        "required":
            user_manager.bootstrap_required()
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

@router.post(
    "/users"
)
def create_user(
    request: CreateUserRequest,
    current_user=
        Depends(
            get_current_user
        ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail=
                "Admin access required.",
        )

    password_hash = (
        auth_manager.hash_password(
            request.password
        )
    )
    
    try:

        user_manager.create_user(
            request.username,
            password_hash,
            request.role,
        )

    except RuntimeError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return {
        "success": True,
        "message":
            "User created successfully.",
    }

@router.get(
    "/users"
)
def list_users(
    current_user=
        Depends(
            get_current_user
        ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail=
                "Admin access required.",
        )

    users = []

    for user in user_manager.list_users():

        users.append(
            {
                "username":
                    user["username"],

                "role":
                    user["role"],

                "created_at":
                    user["created_at"],
            }
        )

    return users

@router.delete(
    "/users/{username}"
)
def delete_user(
    username: str,
    current_user=
        Depends(
            get_current_user
        ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail=
                "Admin access required.",
        )

    user_manager.delete_user(
        username
    )

    return {
        "success": True,
        "message":
            "User deleted successfully.",
    }

@router.delete(
    "/users"
)
def delete_all_users(
    current_user=
        Depends(
            get_current_user
        ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail=
                "Admin access required.",
        )

    user_manager.delete_all_except_last_admin()

    return {
        "success": True,
        "message":
            "All users deleted except the oldest admin.",
    }

@router.put(
    "/change-password"
)
def change_password(
    request: ChangePasswordRequest,
    current_user=
        Depends(
            get_current_user
        ),
):

    user = (
        user_manager.get_user(
            current_user[
                "username"
            ]
        )
    )

    if not auth_manager.verify_password(
        request.old_password,
        user[
            "password_hash"
        ],
    ):
        raise HTTPException(
            status_code=401,
            detail=
                "Incorrect password.",
        )

    new_hash = (
        auth_manager.hash_password(
            request.new_password
        )
    )

    user_manager.change_password(
        current_user[
            "username"
        ],
        new_hash,
    )

    return {
        "success": True,
        "message":
            "Password changed successfully.",
    }