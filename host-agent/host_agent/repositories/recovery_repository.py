import json

from host_agent.database.connection import (
    get_connection,
)


class RecoveryRepository:
    """
    Repository responsible for persistent recovery events.

    Contains only database access.
    No recovery logic or statistics calculation.
    """

    def append_event(
        self,
        event_time: float,
        service: str,
        event: str,
        details=None,
    ) -> None:

        details_json = (
            json.dumps(details)
            if details is not None
            else None
        )

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                INSERT INTO recovery_events (
                    time,
                    service,
                    event,
                    details
                )
                VALUES (?, ?, ?, ?);
                """,
                (
                    event_time,
                    service,
                    event,
                    details_json,
                ),
            )

    def get_events(
        self,
        limit: int = 100,
    ) -> list[dict]:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    id,
                    time,
                    service,
                    event,
                    details
                FROM recovery_events
                ORDER BY
                    time DESC,
                    id DESC
                LIMIT ?;
                """,
                (limit,),
            )

            rows = cursor.fetchall()

            events = []

            for row in rows:

                details = (
                    json.loads(row[4])
                    if row[4] is not None
                    else None
                )

                events.append(
                    {
                        "id": row[0],
                        "time": row[1],
                        "service": row[2],
                        "event": row[3],
                        "details": details,
                    }
                )

            return events


recovery_repository = RecoveryRepository()