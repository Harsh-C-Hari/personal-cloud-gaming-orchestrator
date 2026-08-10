from host_agent.database.connection import (
    get_connection,
)


class SunshineStreamStateRepository:
    """
    Repository responsible for persistent Sunshine stream state.

    Contains only database access.
    No stream lifecycle logic or business logic.
    """

    def get(self) -> dict:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT
                    state,
                    app_name,
                    started_at,
                    ended_at,
                    duration_seconds,
                    width,
                    height,
                    fps,
                    hdr,
                    transport_connected,
                    awaiting_reconnect,
                    last_disconnect_at,
                    last_reconnect_at
                FROM sunshine_stream_state
                WHERE id = 1;
                """
            )

            row = cursor.fetchone()

            if row is None:
                return {
                    "state": "idle",
                    "app_name": None,
                    "started_at": None,
                    "ended_at": None,
                    "duration_seconds": None,
                    "width": None,
                    "height": None,
                    "fps": None,
                    "hdr": None,
                    "transport_connected": False,
                    "awaiting_reconnect": False,
                    "last_disconnect_at": None,
                    "last_reconnect_at": None,
                }

            return {
                "state": row[0],
                "app_name": row[1],
                "started_at": row[2],
                "ended_at": row[3],
                "duration_seconds": row[4],
                "width": row[5],
                "height": row[6],
                "fps": row[7],
                "hdr": bool(row[8])
                if row[8] is not None
                else None,
                "transport_connected": bool(row[9]),
                "awaiting_reconnect": bool(row[10]),
                "last_disconnect_at": row[11],
                "last_reconnect_at": row[12],
            }

    def save(
        self,
        state: dict,
    ) -> None:

        with get_connection() as connection:

            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE sunshine_stream_state
                SET
                    state = ?,
                    app_name = ?,
                    started_at = ?,
                    ended_at = ?,
                    duration_seconds = ?,
                    width = ?,
                    height = ?,
                    fps = ?,
                    hdr = ?,
                    transport_connected = ?,
                    awaiting_reconnect = ?,
                    last_disconnect_at = ?,
                    last_reconnect_at = ?
                WHERE id = 1;
                """,
                (
                    state["state"],
                    state["app_name"],
                    state["started_at"],
                    state["ended_at"],
                    state["duration_seconds"],
                    state["width"],
                    state["height"],
                    state["fps"],
                    state["hdr"],
                    state["transport_connected"],
                    state["awaiting_reconnect"],
                    state["last_disconnect_at"],
                    state["last_reconnect_at"],
                ),
            )


sunshine_stream_state_repository = (
    SunshineStreamStateRepository()
)