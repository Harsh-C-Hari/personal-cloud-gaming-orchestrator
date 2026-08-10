from __future__ import annotations
from host_agent.database.connection import (
    get_connection,
)


class SessionMetadataRepository:
    """
    Repository responsible for persistent session metadata.

    Contains only database access.
    No session lifecycle logic or business logic.
    """

    def save(
        self,
        record: dict,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO session_metadata (
                    session_id,
                    user_id,
                    game_id,
                    exe_name,
                    game_save_path,
                    backup_path,
                    state,
                    created_at,
                    updated_at,
                    ended_at,
                    crash_recovery_required,
                    latest_save_hash,
                    injected_save_hash,
                    archive_hash,
                    archive_path,
                    latest_manifest_verified,
                    backup_manifest_verified,
                    archive_verified,
                    integrity_verified,
                    restore_verified,
                    restore_source,
                    live_sync_triggered,
                    live_sync_count,
                    live_sync_last_time,
                    live_sync_preserved,
                    live_sync_hash,
                    live_sync_fallback,
                    backup_failed,
                    archive_failed,
                    cleanup_result
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                ON CONFLICT(session_id)
                DO UPDATE SET
                    user_id = excluded.user_id,
                    game_id = excluded.game_id,
                    exe_name = excluded.exe_name,
                    game_save_path = excluded.game_save_path,
                    backup_path = excluded.backup_path,
                    state = excluded.state,
                    created_at = excluded.created_at,
                    updated_at = excluded.updated_at,
                    ended_at = excluded.ended_at,
                    crash_recovery_required =
                        excluded.crash_recovery_required,
                    latest_save_hash =
                        excluded.latest_save_hash,
                    injected_save_hash =
                        excluded.injected_save_hash,
                    archive_hash =
                        excluded.archive_hash,
                    archive_path =
                        excluded.archive_path,
                    latest_manifest_verified =
                        excluded.latest_manifest_verified,
                    backup_manifest_verified =
                        excluded.backup_manifest_verified,
                    archive_verified =
                        excluded.archive_verified,
                    integrity_verified =
                        excluded.integrity_verified,
                    restore_verified =
                        excluded.restore_verified,
                    restore_source =
                        excluded.restore_source,
                    live_sync_triggered =
                        excluded.live_sync_triggered,
                    live_sync_count =
                        excluded.live_sync_count,
                    live_sync_last_time =
                        excluded.live_sync_last_time,
                    live_sync_preserved =
                        excluded.live_sync_preserved,
                    live_sync_hash =
                        excluded.live_sync_hash,
                    live_sync_fallback =
                        excluded.live_sync_fallback,
                    backup_failed =
                        excluded.backup_failed,
                    archive_failed =
                        excluded.archive_failed,
                    cleanup_result =
                        excluded.cleanup_result;
                """,
                (
                    record["session_id"],
                    record["user_id"],
                    record["game_id"],
                    record["exe_name"],
                    record["game_save_path"],
                    record["backup_path"],
                    record["state"],
                    record["created_at"],
                    record["updated_at"],
                    record.get("ended_at"),
                    record.get(
                        "crash_recovery_required"
                    ),
                    record.get("latest_save_hash"),
                    record.get("injected_save_hash"),
                    record.get("archive_hash"),
                    record.get("archive_path"),
                    record.get(
                        "latest_manifest_verified"
                    ),
                    record.get(
                        "backup_manifest_verified"
                    ),
                    record.get("archive_verified"),
                    record.get("integrity_verified"),
                    record.get("restore_verified"),
                    record.get("restore_source"),
                    record.get("live_sync_triggered"),
                    record.get("live_sync_count"),
                    record.get("live_sync_last_time"),
                    record.get("live_sync_preserved"),
                    record.get("live_sync_hash"),
                    record.get("live_sync_fallback"),
                    record.get("backup_failed"),
                    record.get("archive_failed"),
                    record.get("cleanup_result"),
                ),
            )

    def get(
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
                    exe_name,
                    game_save_path,
                    backup_path,
                    state,
                    created_at,
                    updated_at,
                    ended_at,
                    crash_recovery_required,
                    latest_save_hash,
                    injected_save_hash,
                    archive_hash,
                    archive_path,
                    latest_manifest_verified,
                    backup_manifest_verified,
                    archive_verified,
                    integrity_verified,
                    restore_verified,
                    restore_source,
                    live_sync_triggered,
                    live_sync_count,
                    live_sync_last_time,
                    live_sync_preserved,
                    live_sync_hash,
                    live_sync_fallback,
                    backup_failed,
                    archive_failed,
                    cleanup_result
                FROM session_metadata
                WHERE session_id = ?;
                """,
                (session_id,),
            )

            row = cursor.fetchone()

            if row is None:
                return None

            return self._row_to_dict(row)

    def update_state(
        self,
        session_id: str,
        state: str,
        updated_at: float,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE session_metadata
                SET
                    state = ?,
                    updated_at = ?
                WHERE session_id = ?;
                """,
                (
                    state,
                    updated_at,
                    session_id,
                ),
            )

    def update_field(
        self,
        session_id: str,
        field: str,
        value,
        updated_at: float,
    ) -> None:

        allowed_fields = {
            "user_id",
            "game_id",
            "exe_name",
            "game_save_path",
            "backup_path",
            "state",
            "created_at",
            "ended_at",
            "crash_recovery_required",
            "latest_save_hash",
            "injected_save_hash",
            "archive_hash",
            "archive_path",
            "latest_manifest_verified",
            "backup_manifest_verified",
            "archive_verified",
            "integrity_verified",
            "restore_verified",
            "restore_source",
            "live_sync_triggered",
            "live_sync_count",
            "live_sync_last_time",
            "live_sync_preserved",
            "live_sync_hash",
            "live_sync_fallback",
            "backup_failed",
            "archive_failed",
            "cleanup_result",
        }

        if field not in allowed_fields:
            raise ValueError(
                f"Invalid session metadata field: {field}"
            )

        query = f"""
            UPDATE session_metadata
            SET
                {field} = ?,
                updated_at = ?
            WHERE session_id = ?;
        """

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                query,
                (
                    value,
                    updated_at,
                    session_id,
                ),
            )

    def list(
        self,
        user_id: str | None = None,
        game_id: str | None = None,
    ) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            query = """
                SELECT
                    session_id,
                    user_id,
                    game_id,
                    exe_name,
                    game_save_path,
                    backup_path,
                    state,
                    created_at,
                    updated_at,
                    ended_at,
                    crash_recovery_required,
                    latest_save_hash,
                    injected_save_hash,
                    archive_hash,
                    archive_path,
                    latest_manifest_verified,
                    backup_manifest_verified,
                    archive_verified,
                    integrity_verified,
                    restore_verified,
                    restore_source,
                    live_sync_triggered,
                    live_sync_count,
                    live_sync_last_time,
                    live_sync_preserved,
                    live_sync_hash,
                    live_sync_fallback,
                    backup_failed,
                    archive_failed,
                    cleanup_result
                FROM session_metadata
            """

            conditions = []
            parameters = []

            if user_id is not None:
                conditions.append(
                    "user_id = ?"
                )
                parameters.append(user_id)

            if game_id is not None:
                conditions.append(
                    "game_id = ?"
                )
                parameters.append(game_id)

            if conditions:
                query += (
                    " WHERE "
                    + " AND ".join(conditions)
                )

            query += """
                ORDER BY created_at DESC;
            """

            cursor.execute(
                query,
                parameters,
            )

            rows = cursor.fetchall()

            return [
                self._row_to_dict(row)
                for row in rows
            ]

    def list_active(self) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    session_id,
                    user_id,
                    game_id,
                    exe_name,
                    game_save_path,
                    backup_path,
                    state,
                    created_at,
                    updated_at,
                    ended_at,
                    crash_recovery_required,
                    latest_save_hash,
                    injected_save_hash,
                    archive_hash,
                    archive_path,
                    latest_manifest_verified,
                    backup_manifest_verified,
                    archive_verified,
                    integrity_verified,
                    restore_verified,
                    restore_source,
                    live_sync_triggered,
                    live_sync_count,
                    live_sync_last_time,
                    live_sync_preserved,
                    live_sync_hash,
                    live_sync_fallback,
                    backup_failed,
                    archive_failed,
                    cleanup_result
                FROM session_metadata
                WHERE ended_at IS NULL
                ORDER BY created_at DESC;
                """
            )

            rows = cursor.fetchall()

            return [
                self._row_to_dict(row)
                for row in rows
            ]

    def delete(
        self,
        session_id: str,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                DELETE FROM session_metadata
                WHERE session_id = ?;
                """,
                (session_id,),
            )

    def exists(
        self,
        session_id: str,
    ) -> bool:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT 1
                FROM session_metadata
                WHERE session_id = ?
                LIMIT 1;
                """,
                (session_id,),
            )

            return cursor.fetchone() is not None
    
    def count(self) -> int:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM session_metadata;
                """
            )

            row = cursor.fetchone()

            return row[0]

    @staticmethod
    def _row_to_dict(row) -> dict:

        return {
            "session_id": row[0],
            "user_id": row[1],
            "game_id": row[2],
            "exe_name": row[3],
            "game_save_path": row[4],
            "backup_path": row[5],
            "state": row[6],
            "created_at": row[7],
            "updated_at": row[8],
            "ended_at": row[9],
            "crash_recovery_required": (
                None
                if row[10] is None
                else bool(row[10])
            ),
            "latest_save_hash": row[11],
            "injected_save_hash": row[12],
            "archive_hash": row[13],
            "archive_path": row[14],
            "latest_manifest_verified": (
                None
                if row[15] is None
                else bool(row[15])
            ),
            "backup_manifest_verified": (
                None
                if row[16] is None
                else bool(row[16])
            ),
            "archive_verified": (
                None
                if row[17] is None
                else bool(row[17])
            ),
            "integrity_verified": (
                None
                if row[18] is None
                else bool(row[18])
            ),
            "restore_verified": (
                None
                if row[19] is None
                else bool(row[19])
            ),
            "restore_source": row[20],
            "live_sync_triggered": (
                None
                if row[21] is None
                else bool(row[21])
            ),
            "live_sync_count": row[22],
            "live_sync_last_time": row[23],
            "live_sync_preserved": (
                None
                if row[24] is None
                else bool(row[24])
            ),
            "live_sync_hash": row[25],
            "live_sync_fallback": (
                None
                if row[26] is None
                else bool(row[26])
            ),
            "backup_failed": (
                None
                if row[27] is None
                else bool(row[27])
            ),
            "archive_failed": (
                None
                if row[28] is None
                else bool(row[28])
            ),
            "cleanup_result": row[29],
        }


session_metadata_repository = (
    SessionMetadataRepository()
)