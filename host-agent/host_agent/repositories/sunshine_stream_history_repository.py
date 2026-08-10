from host_agent.database.connection import (
    get_connection,
)


class SunshineStreamHistoryRepository:
    """
    Repository responsible for persistent Sunshine stream history.

    Contains only database access.
    No stream lifecycle logic or analytics.
    """

    def append(
        self,
        record: dict,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO sunshine_stream_history (
                    recorded_at,
                    app_name,
                    started_at,
                    ended_at,
                    duration_seconds,
                    width,
                    height,
                    fps,
                    hdr,
                    stream_ended_intentionally
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?
                );
                """,
                (
                    record["recorded_at"],
                    record["app_name"],
                    record["started_at"],
                    record["ended_at"],
                    record["duration_seconds"],
                    record["width"],
                    record["height"],
                    record["fps"],
                    record["hdr"],
                    record.get(
                        "stream_ended_intentionally",
                        False,
                    ),
                ),
            )

    def get_history(
        self,
        limit: int = 50,
    ) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    id,
                    recorded_at,
                    app_name,
                    started_at,
                    ended_at,
                    duration_seconds,
                    width,
                    height,
                    fps,
                    hdr,
                    stream_ended_intentionally
                FROM sunshine_stream_history
                ORDER BY
                    recorded_at DESC,
                    id DESC
                LIMIT ?;
                """,
                (limit,),
            )

            rows = cursor.fetchall()

            history = []

            for row in rows:

                history.append(
                    {
                        "id": row[0],
                        "recorded_at": row[1],
                        "app_name": row[2],
                        "started_at": row[3],
                        "ended_at": row[4],
                        "duration_seconds": row[5],
                        "width": row[6],
                        "height": row[7],
                        "fps": row[8],
                        "hdr": bool(row[9]),
                        "stream_ended_intentionally": bool(
                            row[10]
                        ),
                    }
                )

            return history

    def count(
        self,
    ) -> int:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM sunshine_stream_history;
                """
            )

            row = cursor.fetchone()

            return row[0]

    def exists(
        self,
        recorded_at: float,
        app_name: str | None,
        started_at: float,
        ended_at: float,
    ) -> bool:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT 1
                FROM sunshine_stream_history
                WHERE
                    recorded_at = ?
                    AND app_name IS ?
                    AND started_at = ?
                    AND ended_at = ?
                LIMIT 1;
                """,
                (
                    recorded_at,
                    app_name,
                    started_at,
                    ended_at,
                ),
            )

            return cursor.fetchone() is not None


sunshine_stream_history_repository = (
    SunshineStreamHistoryRepository()
)