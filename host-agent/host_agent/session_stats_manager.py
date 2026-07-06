from pathlib import Path
import json
import os

class SessionStatsManager:

    def __init__(self):

        self.path = Path(
            "data/session_stats.json"
        )

    def read(self):

        if not self.path.exists():

            return {
                "total_sessions": 0,
                "successful_sessions": 0,
                "failed_sessions": 0,
                "recovered_sessions": 0,
                "total_playtime_seconds": 0,
            }
        
        with open(
            self.path,
            "r",
            encoding="utf-8",
        ) as file:

            return json.load(file)

    def write(
        self,
        stats,
    ):

        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temp_path = self.path.with_suffix(
            ".tmp"
        )

        with temp_path.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                stats,
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp_path.replace(
            self.path
        )

    def record_session(
        self,
        status,
        played_seconds,
        recovered=False,
    ):

        stats = self.read()

        stats["total_sessions"] += 1

        if status == "completed":

            stats["successful_sessions"] += 1

        elif status == "failed":

            stats["failed_sessions"] += 1

        if recovered:

            stats["recovered_sessions"] += 1

        stats[
            "total_playtime_seconds"
        ] += (
            played_seconds or 0
        )

        self.write(stats)

session_stats_manager = (
    SessionStatsManager()
)