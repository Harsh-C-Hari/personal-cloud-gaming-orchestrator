import json
import secrets
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

    "data/active_sessions.json": {},

    "data/sunshine_stream_state.json": {
        "state": "idle",
        "app_name": None,
        "started_at": None,
        "ended_at": None,
        "duration_seconds": None,
        "width": None,
        "height": None,
        "fps": None,
        "hdr": None,
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

    _ensure_internal_event_token(
        config_path
    )


def _ensure_internal_event_token(
    config_path: Path,
):
    """
    Backfills `backend.internal_event_token` — the shared secret that
    lets sunshine_stream_hook.py / sunshine_transport_monitor.py (and only
    them, see api/internal_event_auth.py) call the four stream/transport
    event endpoints. Runs on every startup, for both a freshly-created
    config.json (from DEFAULT_CONFIG, where it's blank) and an existing
    config.json from before this token existed. Once a token is present,
    this is a no-op.
    """

    with config_path.open(
        "r",
        encoding="utf-8",
    ) as file:
        config = json.load(file)

    backend = config.setdefault(
        "backend",
        {},
    )

    if not backend.get(
        "internal_event_token"
    ):

        backend[
            "internal_event_token"
        ] = secrets.token_urlsafe(32)

        with config_path.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                config,
                file,
                indent=4,
                ensure_ascii=False,
            )