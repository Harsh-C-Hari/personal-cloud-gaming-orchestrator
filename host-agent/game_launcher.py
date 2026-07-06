from __future__ import annotations

import subprocess
import time
from pathlib import Path
from typing import Optional

import psutil
import os

from host_agent.logging_config import configure_logger

logger = configure_logger()


class GameLauncher:

    def __init__(self) -> None:
        self.active_process: Optional[subprocess.Popen] = None

    def launch_game(
        self,
        executable_path: str,
        working_directory: str | None = None,
        arguments: list[str] | None = None,
        session_id: str | None = None,
        game_id: str | None = None,
        user_id: str | None = None,
    ) -> int:

        exe_path = Path(executable_path)

        if not exe_path.exists():
            raise FileNotFoundError(
                f"Game executable not found: {exe_path}"
            )

        command = [str(exe_path)]

        if arguments:
            command.extend(arguments)

        logger.info(
            f"Launching game: {exe_path.name}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )

        logger.info(
            f"Game EXE path: {exe_path}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )

        logger.info(
            f"Current working directory: "
            f"{os.getcwd()}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )
        
        self.active_process = subprocess.Popen(
            [str(exe_path)],
            cwd=str(Path(exe_path).parent),
        )

        logger.info(
            f"Game launched successfully "
            f"(PID={self.active_process.pid})",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )

        return self.active_process.pid


    def force_close_game(
        self,
        process_name: str,
        session_id: str | None = None,
        game_id: str | None = None,
        user_id: str | None = None,
    ):

        logger.warning(
            f"Force closing game: "
            f"{process_name}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )

        for process in psutil.process_iter(
            ["pid", "name"]
        ):

            try:

                if (
                    process.info["name"]
                    and process.info["name"].lower()
                    == process_name.lower()
                ):

                    process.kill()

                    logger.info(
                        f"Game process killed with psutil: "
                        f"{process_name}",
                        extra={
                            "session_id": session_id,
                            "game_id": game_id,
                            "user_id": user_id,
                        },
                    )

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
            ):

                continue

        # Attempt graceful process termination first.
        # taskkill is always executed afterward to ensure
        # child processes are also terminated.
        
        subprocess.run(
            [
                "taskkill",
                "/F",
                "/IM",
                process_name,
                "/T",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        logger.info(
            f"taskkill fallback executed for: "
            f"{process_name}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )

    @staticmethod
    def is_process_running(
        process_name: str,
    ) -> bool:

        process_name = process_name.lower()

        for process in psutil.process_iter(["name"]):

            try:
                name = process.info["name"]

                if name and name.lower() == process_name:
                    return True

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
            ):
                continue

        return False

    @staticmethod
    def terminate_process_by_name(
        process_name: str,
        session_id: str | None = None,
        game_id: str | None = None,
        user_id: str | None = None,
    ) -> None:

        process_name = process_name.lower()

        for process in psutil.process_iter(
            ["pid", "name"]
        ):

            try:
                name = process.info["name"]

                if name and name.lower() == process_name:

                    logger.warning(
                        f"Terminating process: {name}",
                        extra={
                            "session_id": session_id,
                            "game_id": game_id,
                            "user_id": user_id,
                        },
                    )

                    process.terminate()

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
            ):
                continue

    @staticmethod
    def force_kill_process(
        process_name: str,
        session_id: str | None = None,
        game_id: str | None = None,
        user_id: str | None = None,
    ) -> None:

        process_name = process_name.lower()

        for process in psutil.process_iter(
            ["pid", "name"]
        ):

            try:
                name = process.info["name"]

                if name and name.lower() == process_name:

                    logger.warning(
                        f"Force killing process: {name}",
                        extra={
                            "session_id": session_id,
                            "game_id": game_id,
                        },
                    )

                    process.kill()

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
            ):
                continue

    @staticmethod
    def wait_for_process_exit(
        process_name: str,
        polling_interval: int = 5,
        session_id: str | None = None,
        game_id: str | None = None,
        user_id: str | None = None,
    ) -> None:

        logger.info(
            f"Waiting for process exit: {process_name}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )

        while GameLauncher.is_process_running(
            process_name
        ):
            time.sleep(polling_interval)

        logger.info(
            f"Process exited: {process_name}",
            extra={
                "session_id": session_id,
                "game_id": game_id,
                "user_id": user_id,
            },
        )