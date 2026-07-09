from pathlib import Path
import sys

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

from host_agent.sunshine_stream_tracker import (
    sunshine_stream_tracker,
)


action = (
    sys.argv[1]
    if len(sys.argv) > 1
    else None
)

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

elif action == "stop":

    sunshine_stream_tracker.stream_stopped()