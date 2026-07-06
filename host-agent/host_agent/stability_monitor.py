import time
from pathlib import Path

from host_agent.logging_config import configure_logger

logger = configure_logger()


class FileStabilityMonitor:

    def wait_until_save_files_stable(
        self,
        save_dir: Path,
        stable_duration: int = 10,
        polling_interval: int = 2,
        session_id=None,
    ) -> None:

        logger.info(
            f"Waiting for save files to stabilize: {save_dir}",
            extra={
                "session_id": session_id,
            },
        )

        start_time = time.time()
        max_wait = 120
        
        last_snapshot = {}
        stable_since = None

        while True:
            
            if time.time() - start_time > max_wait:
                logger.warning(
                    "Save stabilization timeout.",
                    extra={
                        "session_id": session_id,
                    },
                )
                return
            
            current_snapshot = {}

            for file in save_dir.rglob("*"):

                if not file.is_file():
                    continue

                try:

                    stat = file.stat()

                except (
                    PermissionError,
                    OSError,
                    FileNotFoundError,
                ):

                    logger.debug(
                        f"Skipping unstable file: {file}",
                        extra={
                            "session_id": session_id,
                        },
                    )

                    stable_since = None

                    continue

                current_snapshot[str(file)] = (
                    stat.st_size,
                    stat.st_mtime,
                )

            if current_snapshot == last_snapshot:

                if stable_since is None:
                    stable_since = time.time()

                elapsed = time.time() - stable_since

                if elapsed >= stable_duration:
                    logger.info(
                        "Save files stabilized.",
                        extra={
                            "session_id": session_id,
                        },
                    )
                    return

            else:
                stable_since = None

            last_snapshot = current_snapshot
            
            time.sleep(polling_interval)