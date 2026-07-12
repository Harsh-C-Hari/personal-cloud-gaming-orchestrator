from pathlib import Path
import sys
import json
import time

PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

sys.path.insert(
    0,
    str(PROJECT_ROOT)
)

import os
import requests

from host_agent.sunshine_stream_tracker import (
    sunshine_stream_tracker,
)


action = (
    sys.argv[1]
    if len(sys.argv) > 1
    else None
)

PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parent
)

CONFIG_PATH = (
    PROJECT_ROOT
    / "config.json"
)

internal_api_url = (
    "http://127.0.0.1:8100"
)

try:
    if CONFIG_PATH.exists():

        with open(
            CONFIG_PATH,
            "r",
            encoding="utf-8",
        ) as file:

            config = json.load(file)

        internal_api_url = (
            config
            .get(
                "backend",
                {}
            )
            .get(
                "internal_api_url",
                "http://127.0.0.1:8100"
            )
        )

except Exception:
    pass

if action == "start":

    sunshine_stream_tracker.stream_started(
        app_name=os.getenv(
            "SUNSHINE_APP_NAME"
        ),
        width=int(
            os.getenv(
                "SUNSHINE_CLIENT_WIDTH",
                0,
            )
        ),
        height=int(
            os.getenv(
                "SUNSHINE_CLIENT_HEIGHT",
                0,
            )
        ),
        fps=int(
            os.getenv(
                "SUNSHINE_CLIENT_FPS",
                0,
            )
        ),
        hdr=(
            os.getenv(
                "SUNSHINE_CLIENT_HDR",
                "false",
            ).lower()
            == "true"
        ),
    )

    try:

        requests.post(
            f"{internal_api_url}/host/sunshine/stream-started",
            timeout=5,
        )

    except Exception:
        pass

elif action == "stop":
    
    try:

        sunshine_stream_tracker.stream_stopped()
        
        requests.post(
            f"{internal_api_url}/host/sunshine/stream-ended",
            timeout=5,
        )

    except Exception as e:
        with open(
            PROJECT_ROOT / "stream_hook_error.txt",
            "a",
        ) as f:
            f.write(
                f"{time.time()} {e}\n"
            )