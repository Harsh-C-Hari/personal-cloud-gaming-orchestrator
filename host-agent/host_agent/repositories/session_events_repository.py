from host_agent.database.connection import (
    get_connection,
)


class SessionEventsRepository:
    """
    Repository responsible for persistent session events.

    Contains only database access.
    No session lifecycle logic or business logic.
    """

    def append_event(
        self,
        event_time: float,
        session_id: str,
        user_id: str | None,
        game_id: str | None,
        status: str,
        message: str = "",
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO session_events (
                    time,
                    session_id,
                    user_id,
                    game_id,
                    status,
                    message
                )
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (
                    event_time,
                    session_id,
                    user_id,
                    game_id,
                    status,
                    message,
                ),
            )

    def get_events(
        self,
        limit: int = 50,
        session_id: str | None = None,
        user_id: str | None = None,
    ) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            query = """
                SELECT
                    id,
                    time,
                    session_id,
                    user_id,
                    game_id,
                    status,
                    message
                FROM session_events
            """

            conditions = []
            parameters = []

            if session_id is not None:

                conditions.append(
                    "session_id = ?"
                )

                parameters.append(
                    session_id
                )

            if user_id is not None:

                conditions.append(
                    "user_id = ?"
                )

                parameters.append(
                    user_id
                )

            if conditions:

                query += (
                    " WHERE "
                    + " AND ".join(
                        conditions
                    )
                )

            query += """
                ORDER BY
                    time DESC,
                    id DESC
                LIMIT ?;
            """

            parameters.append(
                limit
            )

            cursor.execute(
                query,
                parameters,
            )

            rows = cursor.fetchall()

            events = []

            for row in rows:

                events.append(
                    {
                        "id": row[0],
                        "time": row[1],
                        "session_id": row[2],
                        "user_id": row[3],
                        "game_id": row[4],
                        "status": row[5],
                        "message": row[6],
                    }
                )

            return events

    def count(
        self,
    ) -> int:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM session_events;
                """
            )

            row = cursor.fetchone()

            return row[0]


session_events_repository = (
    SessionEventsRepository()
)