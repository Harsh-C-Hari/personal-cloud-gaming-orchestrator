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

        self.history_path = (
            PROJECT_ROOT
            / "data"
            / "sunshine_stream_history.json"
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
                "transport_connected": False,
                "awaiting_reconnect": False,
                "last_disconnect_at": None,
                "last_reconnect_at": None,
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

    def read_history(self):

        if not self.history_path.exists():
            return []

        with open(
            self.history_path,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    def write_history(
        self,
        history,
    ):

        self.history_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temp = self.history_path.with_suffix(
            ".tmp"
        )

        with open(
            temp,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                history,
                file,
                indent=4,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp.replace(
            self.history_path
        )

    def append_history(
        self,
        stream,
    ):
        history = self.read_history()

        history.append(stream)

        self.write_history(
            history
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
        state["duration_seconds"] = 0
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
        if state["started_at"]:

            state["duration_seconds"] = (
                state["ended_at"]
                - state["started_at"]
            )
        else:
            state["duration_seconds"] = None

        self.write(state)

        history_entry = {
            "recorded_at":
                time.time(),
            "app_name":
                state["app_name"],
            "started_at":
                state["started_at"],
            "ended_at":
                state["ended_at"],
            "duration_seconds":
                state["duration_seconds"],
            "width":
                state["width"],
            "height":
                state["height"],
            "fps":
                state["fps"],
            "hdr":
                state["hdr"],
            "stream_ended_intentionally": True,
        }

        self.append_history(
            history_entry
        )

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

    def transport_connected(self):
        state = self.read()

        state["transport_connected"] = True
        state["awaiting_reconnect"] = False

        if state["last_disconnect_at"] is not None:
            state["last_reconnect_at"] = time.time()

        self.write(state)

    def transport_disconnected(self):
        state = self.read()

        state["transport_connected"] = False
        state["awaiting_reconnect"] = True
        state["last_disconnect_at"] = time.time()

        self.write(state)


sunshine_stream_tracker = (
    SunshineStreamTracker()
)