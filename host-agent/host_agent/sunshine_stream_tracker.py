from pathlib import Path
import json
import os
import time


class SunshineStreamTracker:

    def __init__(self):
        PROJECT_ROOT = (
            Path(__file__)
            .resolve()
            .parent
            .parent
        )

        self.path = (
            PROJECT_ROOT
            / "data"
            / "sunshine_stream_state.json"
        )

    def read(self):

        if not self.path.exists():
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
            }

        with open(
            self.path,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    def write(
        self,
        data,
    ):

        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temp = self.path.with_suffix(
            ".tmp"
        )

        with open(
            temp,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                data,
                file,
                indent=4,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp.replace(
            self.path
        )

    def stream_started(
        self,
        app_name,
        width,
        height,
        fps,
        hdr,
    ):

        state = self.read()

        state["state"] = "streaming"
        state["app_name"] = app_name
        state["started_at"] = time.time()
        state["ended_at"] = None
        state["width"] = width
        state["height"] = height
        state["fps"] = fps
        state["hdr"] = hdr

        self.write(state)

    def stream_stopped(
        self,
    ):

        state = self.read()

        state["state"] = "idle"
        state["ended_at"] = time.time()
        state["duration_seconds"] = (
            state["ended_at"]
            - state["started_at"]
        )

        self.write(state)

    def get_state(
        self,
    ):
        state = self.read()
        if (
            state["state"] == "streaming"
            and state["started_at"]
        ):
            state["duration_seconds"] = (
                time.time()
                - state["started_at"]
            )

        return state


sunshine_stream_tracker = (
    SunshineStreamTracker()
)