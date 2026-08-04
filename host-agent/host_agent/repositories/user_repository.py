from host_agent.database.connection import (
    get_connection,
)


class UserRepository:
    """
    Repository responsible for all persistent user storage.

    Contains only database access.
    No business logic, password hashing, or authentication.
    """

    def get_user(
        self,
        username: str,
    ) -> dict | None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    username,
                    password_hash,
                    role,
                    created_at
                FROM users
                WHERE username = ?;
                """,
                (username,),
            )

            row = cursor.fetchone()

            if row is None:
                return None

            return {
                "username": row[0],
                "password_hash": row[1],
                "role": row[2],
                "created_at": row[3],
            }

    def list_users(
        self,
    ) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    username,
                    role,
                    created_at
                FROM users
                ORDER BY created_at;
                """
            )

            rows = cursor.fetchall()

            users = []

            for row in rows:

                users.append(
                    {
                        "username": row[0],
                        "role": row[1],
                        "created_at": row[2],
                    }
                )

            return users

    def count_admins(
        self,
    ) -> int:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM users
                WHERE role = ?;
                """,
                ("admin",),
            )

            row = cursor.fetchone()

            return row[0]

    def create_user(
        self,
        username: str,
        password_hash: str,
        role: str,
        created_at: float,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO users (
                    username,
                    password_hash,
                    role,
                    created_at
                )
                VALUES (?, ?, ?, ?);
                """,
                (
                    username,
                    password_hash,
                    role,
                    created_at,
                ),
            )

    def update_password_hash(
        self,
        username: str,
        password_hash: str,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE users
                SET password_hash = ?
                WHERE username = ?;
                """,
                (
                    password_hash,
                    username,
                ),
            )

    def delete_user(
        self,
        username: str,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                DELETE
                FROM users
                WHERE username = ?;
                """,
                (username,),
            )

    def delete_all_except(
        self,
        username: str,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                DELETE
                FROM users
                WHERE username != ?;
                """,
                (username,),
            )


user_repository = UserRepository()