from pydantic import BaseModel


class LoginRequest(
    BaseModel
):
    username: str
    password: str

class CreateUserRequest(
    BaseModel
):
    username: str
    password: str
    role: str = "user"

class ChangePasswordRequest(
    BaseModel
):
    old_password: str
    new_password: str

class BootstrapAdminRequest(
    BaseModel
):
    username: str
    password: str