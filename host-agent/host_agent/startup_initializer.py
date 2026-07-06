import json
from pathlib import Path

from host_agent.config_defaults import (
    DEFAULT_CONFIG,
)

from host_agent.games_defaults import (
    DEFAULT_GAMES,
)

DIRECTORIES = [
    "logs",
    "metadata",
    "data",
]

FILES = {
    "metadata/session_metadata.json": {
        "sessions": {}
    },

    "data/active_sessions.json": {},

    "data/session_history.json": [],

    "data/session_events.json": [],

    "data/recovery_events.json": [],

    "data/session_stats.json": {
        "total_sessions": 0,
        "successful_sessions": 0,
        "failed_sessions": 0,
        "recovered_sessions": 0,
        "total_playtime_seconds": 0,
    },

    "games.json": DEFAULT_GAMES,
}
CONFIG_FILE = "config.json"

def initialize_startup():

    for directory in DIRECTORIES:

        Path(directory).mkdir(
            parents=True,
            exist_ok=True,
        )

    for file_path, default_data in FILES.items():

        path = Path(file_path)

        if not path.exists():

            path.write_text(
                json.dumps(
                    default_data,
                    indent=4,
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

    config_path = Path(
        CONFIG_FILE
    )

    if not config_path.exists():

        config_path.write_text(
            json.dumps(
                DEFAULT_CONFIG,
                indent=4,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )