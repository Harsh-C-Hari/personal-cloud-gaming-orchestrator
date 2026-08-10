import time

from host_agent.repositories.sunshine_stream_history_repository import (
    sunshine_stream_history_repository,
)

from host_agent.repositories.sunshine_stream_state_repository import (
    sunshine_stream_state_repository,
)


class SunshineStreamTracker:

    def read(self):

        return sunshine_stream_state_repository.get()

    def write(
        self,
        data,
    ):

        sunshine_stream_state_repository.save(
            data
        )

    def append_history(
        self,
        stream,
    ):

        sunshine_stream_history_repository.append(
            stream
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
        state["awaiting_reconnect"] = False

        if state["started_at"]:

            state["duration_seconds"] = (
                state["ended_at"]
                - state["started_at"]
            )

        else:

            state["duration_seconds"] = None

        self.write(state)

        history_entry = {
            "recorded_at": time.time(),
            "app_name": state["app_name"],
            "started_at": state["started_at"],
            "ended_at": state["ended_at"],
            "duration_seconds": state["duration_seconds"],
            "width": state["width"],
            "height": state["height"],
            "fps": state["fps"],
            "hdr": state["hdr"],
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

    def transport_connected(
        self,
    ):

        state = self.read()

        state["transport_connected"] = True
        state["awaiting_reconnect"] = False

        if state["last_disconnect_at"] is not None:

            state["last_reconnect_at"] = time.time()

        self.write(state)

    def transport_disconnected(
        self,
    ):

        state = self.read()

        state["transport_connected"] = False
        state["awaiting_reconnect"] = True
        state["last_disconnect_at"] = time.time()

        self.write(state)


sunshine_stream_tracker = (
    SunshineStreamTracker()
)