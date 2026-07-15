from jose import jwt
from jose import JWTError
from datetime import datetime
from datetime import timedelta
import json
from pathlib import Path

CONFIG_PATH = (
    Path(__file__)
    .resolve()
    .parent
    .parent
    / "config.json"
)

def get_auth_config():

    if not CONFIG_PATH.exists():
        raise RuntimeError(
            "config.json not found."
        )

    with open(
        CONFIG_PATH,
        "r",
        encoding="utf-8",
    ) as file:

        config = json.load(
            file
        )

    return config.get(
        "auth",
        {}
    )

auth_config = (
    get_auth_config()
)

SECRET_KEY = (
    auth_config[
        "jwt_secret_key"
    ]
)

ALGORITHM = (
    auth_config.get(
        "jwt_algorithm",
        "HS256",
    )
)

ACCESS_TOKEN_EXPIRE_MINUTES = (
    auth_config.get(
        "access_token_expire_minutes",
        1440,
    )
)

class JWTManager:

    def create_access_token(
        self,
        data: dict,
        expires_delta=None,
    ):

        to_encode = data.copy()

        if expires_delta:

            expire = (
                datetime.utcnow()
                + expires_delta
            )

        else:

            expire = (
                datetime.utcnow()
                + timedelta(
                    minutes=ACCESS_TOKEN_EXPIRE_MINUTES
                )
            )

        to_encode.update(
            {
                "exp": expire
            }
        )

        encoded_jwt = jwt.encode(
            to_encode,
            SECRET_KEY,
            algorithm=ALGORITHM,
        )

        return encoded_jwt

    def verify_token(
        self,
        token: str,
    ):

        try:

            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )

            return payload

        except JWTError:

            return None

jwt_manager = (
    JWTManager()
)