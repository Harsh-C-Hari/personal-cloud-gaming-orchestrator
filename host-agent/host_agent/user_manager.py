import time

from host_agent.auth_manager import (
    auth_manager,
)

from host_agent.repositories.user_repository import (
    user_repository,
)

class UserManager:

    def get_user(
        self,
        username,
    ):

        return user_repository.get_user(
            username
        )

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

        users = self.list_users()
        
        if self.exists(
            username
        ):
            raise RuntimeError(
                f"User {username} already exists."
            )

        user_repository.create_user(
            username=username,
            password_hash=password_hash,
            role=role,
            created_at=time.time(),
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

    def list_users(
        self,
    ):

        return user_repository.list_users()

    def admin_count(
        self,
    ):

        return user_repository.count_admins()

    def delete_user(
        self,
        username,
    ):
        users = self.list_users()

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

        user_repository.delete_user(
            username
        )

    def change_password(
        self,
        username,
        password_hash,
    ):

        if not self.exists(
            username
        ):
            raise RuntimeError(
                "User not found."
            )

        user_repository.update_password_hash(
            username,
            password_hash,
        )

    def bootstrap_required(
        self,
    ):
        return self.admin_count() == 0

    def delete_all_except_last_admin(
        self,
    ):

        users = self.list_users()

        admins = [
            user
            for user in users
            if user["role"] == "admin"
        ]

        if not admins:
            return

        keep_admin = min(
            admins,
            key=lambda user: user["created_at"]
        )

        user_repository.delete_all_except(
            keep_admin["username"]
        )



user_manager = (
    UserManager()
)