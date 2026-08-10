import sqlite3
from pathlib import Path

PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parent
    .parent
    .parent
)

DATABASE_PATH = (
    PROJECT_ROOT
    / "data"
    / "pcgo.db"
)


def get_connection() -> sqlite3.Connection:
    """
    Creates and configures a SQLite connection.

    Every repository will obtain its connection through this function
    so all SQLite configuration lives in one place.
    """

    connection = sqlite3.connect(
        DATABASE_PATH,
        check_same_thread=False,
    )

    connection.row_factory = sqlite3.Row

    connection.execute(
        "PRAGMA foreign_keys = ON;"
    )

    connection.execute(
        "PRAGMA journal_mode = WAL;"
    )

    connection.execute(
        "PRAGMA busy_timeout = 5000;"
    )

    return connection