from pathlib import Path

from host_agent.database.connection import (
    get_connection,
)


def initialize_database() -> None:
    """
    Creates the SQLite database and applies the schema.
    Safe to call every startup.
    """

    schema_path = (
        Path(__file__).parent
        / "schema.sql"
    )

    with get_connection() as connection:

        with schema_path.open(
            "r",
            encoding="utf-8",
        ) as file:

            schema = file.read()

        connection.executescript(schema)