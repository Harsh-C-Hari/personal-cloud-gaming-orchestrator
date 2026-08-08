from host_agent.database.connection import (
    get_connection,
)


class SessionHistoryRepository:
    """
    Repository responsible for persistent session history.

    Contains only database access.
    No session lifecycle logic or analytics.
    """

    @staticmethod
    def _bool_or_none(value):
        if value is None:
            return None

        return bool(value)
    
    def append(
        self,
        record: dict,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO session_history (
                    session_id,
                    user_id,
                    game_id,
                    status,
                    started_at,
                    ended_at,
                    played_seconds,
                    error,
                    game_ended_at,
                    integrity_verified,
                    latest_manifest_verified,
                    backup_manifest_verified,
                    archive_verified,
                    backup_path,
                    archive_path,
                    restore_verified,
                    restore_source,
                    restart_count,
                    last_restart_time
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?
                );
                """,
                (
                    record["session_id"],
                    record["user_id"],
                    record["game_id"],
                    record["status"],
                    record["started_at"],
                    record["ended_at"],
                    record["played_seconds"],
                    record["error"],
                    record["game_ended_at"],
                    record["integrity_verified"],
                    record["latest_manifest_verified"],
                    record["backup_manifest_verified"],
                    record["archive_verified"],
                    record["backup_path"],
                    record["archive_path"],
                    record["restore_verified"],
                    record["restore_source"],
                    record["restart_count"],
                    record["last_restart_time"],
                ),
            )

    def get_history(
        self,
        limit: int = 20,
        user_id: str | None = None,
    ) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            if user_id is None:

                cursor.execute(
                    """
                    SELECT
                        session_id,
                        user_id,
                        game_id,
                        status,
                        started_at,
                        ended_at,
                        played_seconds,
                        error,
                        game_ended_at,
                        integrity_verified,
                        latest_manifest_verified,
                        backup_manifest_verified,
                        archive_verified,
                        backup_path,
                        archive_path,
                        restore_verified,
                        restore_source,
                        restart_count,
                        last_restart_time
                    FROM session_history
                    ORDER BY
                        ended_at DESC
                    LIMIT ?;
                    """,
                    (limit,),
                )

            else:

                cursor.execute(
                    """
                    SELECT
                        session_id,
                        user_id,
                        game_id,
                        status,
                        started_at,
                        ended_at,
                        played_seconds,
                        error,
                        game_ended_at,
                        integrity_verified,
                        latest_manifest_verified,
                        backup_manifest_verified,
                        archive_verified,
                        backup_path,
                        archive_path,
                        restore_verified,
                        restore_source,
                        restart_count,
                        last_restart_time
                    FROM session_history
                    WHERE user_id = ?
                    ORDER BY
                        ended_at DESC
                    LIMIT ?;
                    """,
                    (
                        user_id,
                        limit,
                    ),
                )

            rows = cursor.fetchall()

            history = []

            for row in rows:

                history.append(
                    {
                        "session_id": row[0],
                        "user_id": row[1],
                        "game_id": row[2],
                        "status": row[3],
                        "started_at": row[4],
                        "ended_at": row[5],
                        "played_seconds": row[6],
                        "error": row[7],
                        "game_ended_at": row[8],
                        "integrity_verified": self._bool_or_none(row[9]),
                        "latest_manifest_verified": self._bool_or_none(row[10]),
                        "backup_manifest_verified": self._bool_or_none(row[11]),
                        "archive_verified": self._bool_or_none(row[12]),
                        "backup_path": row[13],
                        "archive_path": row[14],
                        "restore_verified": self._bool_or_none(row[15]),
                        "restore_source": row[16],
                        "restart_count": row[17],
                        "last_restart_time": row[18],
                    }
                )

            return history

    def get_by_session_id(
        self,
        session_id: str,
    ) -> dict | None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    session_id,
                    user_id,
                    game_id,
                    status,
                    started_at,
                    ended_at,
                    played_seconds,
                    error,
                    game_ended_at,
                    integrity_verified,
                    latest_manifest_verified,
                    backup_manifest_verified,
                    archive_verified,
                    backup_path,
                    archive_path,
                    restore_verified,
                    restore_source,
                    restart_count,
                    last_restart_time
                FROM session_history
                WHERE session_id = ?;
                """,
                (session_id,),
            )

            row = cursor.fetchone()

            if row is None:
                return None

            return {
                "session_id": row[0],
                "user_id": row[1],
                "game_id": row[2],
                "status": row[3],
                "started_at": row[4],
                "ended_at": row[5],
                "played_seconds": row[6],
                "error": row[7],
                "game_ended_at": row[8],
                "integrity_verified": self._bool_or_none(row[9]),
                "latest_manifest_verified": self._bool_or_none(row[10]),
                "backup_manifest_verified": self._bool_or_none(row[11]),
                "archive_verified": self._bool_or_none(row[12]),
                "backup_path": row[13],
                "archive_path": row[14],
                "restore_verified": self._bool_or_none(row[15]),
                "restore_source": row[16],
                "restart_count": row[17],
                "last_restart_time": row[18],
            }

    def get_user_session_ids(
        self,
        user_id: str,
    ) -> list[str]:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT session_id
                FROM session_history
                WHERE user_id = ?
                ORDER BY ended_at ASC;
                """,
                (user_id,),
            )

            rows = cursor.fetchall()

            return [
                row[0]
                for row in rows
                if row[0]
            ]

    def count(self) -> int:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM session_history;
                """
            )

            row = cursor.fetchone()

            return row[0]

    def exists(
        self,
        session_id: str,
    ) -> bool:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT 1
                FROM session_history
                WHERE session_id = ?;
                """,
                (session_id,),
            )

            return cursor.fetchone() is not None


session_history_repository = (
    SessionHistoryRepository()
)