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

    def list_users(self):
        return self.read()

    def admin_count(self):
        users = self.read()

        return len(
            [
                user
                for user in users
                if user["role"] == "admin"
            ]
        )

    def delete_user(
        self,
        username,
    ):
        users = self.read()

        target = None

        for user in users:
            if user["username"] == username:
                target = user
                break

        if target is None:
            raise RuntimeError(
                "User not found."
            )

        if (
            target["role"] == "admin"
            and self.admin_count() <= 1
        ):
            raise RuntimeError(
                "Cannot delete last admin account."
            )

        users.remove(target)

        self.write(users)

    def change_password(
        self,
        username,
        password_hash,
    ):
        users = self.read()

        found = False

        for user in users:
            if user["username"] == username:
                user["password_hash"] = password_hash
                found = True
                break

        if not found:
            raise RuntimeError(
                "User not found."
            )

        self.write(users)

    def bootstrap_required(
        self,
    ):
        return self.admin_count() == 0

    def delete_all_except_last_admin(
        self,
    ):
        users = self.read()

        admins = [
            user
            for user in users
            if user["role"] == "admin"
        ]

        if not admins:
            self.write([])
            return

        keep_admin = min(
            admins,
            key=lambda user:
                user["created_at"]
        )

        self.write(
            [
                keep_admin
            ]
        )

user_manager = (
    UserManager()
)