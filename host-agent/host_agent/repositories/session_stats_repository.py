from host_agent.database.connection import (
    get_connection,
)


class SessionStatsRepository:

    def read(
        self,
    ) -> dict:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    total_sessions,
                    successful_sessions,
                    failed_sessions,
                    recovered_sessions,
                    total_playtime_seconds
                FROM session_stats
                WHERE id = 1;
                """
            )

            row = cursor.fetchone()

            return {
                "total_sessions": row[0],
                "successful_sessions": row[1],
                "failed_sessions": row[2],
                "recovered_sessions": row[3],
                "total_playtime_seconds": row[4],
            }

    def record_session(
        self,
        status: str,
        played_seconds: float,
        recovered: bool = False,
    ) -> None:

        successful = (
            1
            if status == "completed"
            else 0
        )

        failed = (
            1
            if status == "failed"
            else 0
        )

        recovered_count = (
            1
            if recovered
            else 0
        )

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE session_stats
                SET

                    total_sessions =
                        total_sessions + 1,

                    successful_sessions =
                        successful_sessions + ?,

                    failed_sessions =
                        failed_sessions + ?,

                    recovered_sessions =
                        recovered_sessions + ?,

                    total_playtime_seconds =
                        total_playtime_seconds + ?

                WHERE id = 1;
                """,
                (
                    successful,
                    failed,
                    recovered_count,
                    played_seconds or 0,
                ),
            )

    def increment_recovered_sessions(
        self,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE session_stats
                SET recovered_sessions =
                    recovered_sessions + 1
                WHERE id = 1;
                """
            )


session_stats_repository = (
    SessionStatsRepository()
)