from pathlib import Path
import json
import os
import time

from host_agent.auth_manager import (
    auth_manager,
)

class UserManager:

    def __init__(self):

        self.path = (
            Path(__file__)
            .resolve()
            .parent
            .parent
            / "data"
            / "users.json"
        )

    def read(self):

        if not self.path.exists():
            return []

        try:

            with open(
                self.path,
                "r",
                encoding="utf-8",
            ) as file:

                return json.load(file)

        except Exception:

            return []

    def write(
        self,
        users,
    ):

        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temp = self.path.with_suffix(
            ".tmp"
        )

        with open(
            temp,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                users,
                file,
                indent=4,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp.replace(
            self.path
        )

    def get_user(
        self,
        username,
    ):

        users = self.read()

        for user in users:

            if (
                user.get(
                    "username"
                )
                == username
            ):
                return user

        return None

    def exists(
        self,
        username,
    ):

        return (
            self.get_user(
                username
            )
            is not None
        )

    def create_user(
        self,
        username,
        password_hash,
        role="user",
    ):

        users = self.read()
        
        if self.exists(
            username
        ):
            raise RuntimeError(
                f"User {username} already exists."
            )

        users.append(
            {
                "username": username,
                "password_hash": password_hash,
                "role": role,
                "created_at": time.time(),
            }
        )

        self.write(
            users
        )

    def verify_credentials(
        self,
        username,
        password,
    ):

        user = self.get_user(
            username
        )

        if not user:
            return None

        if not auth_manager.verify_password(
            password,
            user[
                "password_hash"
            ],
        ):
            return None

        return user

user_manager = (
    UserManager()
)