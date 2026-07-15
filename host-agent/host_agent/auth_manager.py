from passlib.context import (
    CryptContext,
)

pwd_context = CryptContext(
    schemes=[
        "bcrypt",
    ],
    deprecated="auto",
)

class AuthManager:

    def hash_password(
        self,
        password,
    ):

        return (
            pwd_context.hash(
                password
            )
        )

    def verify_password(
        self,
        password,
        password_hash,
    ):

        return (
            pwd_context.verify(
                password,
                password_hash,
            )
        )

auth_manager = (
    AuthManager()
)