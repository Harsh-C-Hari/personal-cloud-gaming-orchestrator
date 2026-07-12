import threading
import time
from pathlib import Path
import requests
import json

from host_agent.logging_config import (
    configure_logger,
)

logger = configure_logger()


class SunshineTransportMonitor:

    def __init__(self):

        self.running = False

        self.position = 0

        self.initialized = False

    def start(self):

        if self.running:
            return

        self.running = True

        threading.Thread(
            target=self._loop,
            daemon=True,
        ).start()

        logger.info(
            "Sunshine transport monitor started."
        )

    def _loop(self):

        while self.running:

            try:

                log_path = (
                    self._get_log_path()
                )

                if not log_path:
                    time.sleep(10)
                    continue

                if not log_path.exists():
                    time.sleep(10)
                    continue

                if not self.initialized:

                    self.position = (
                        log_path.stat().st_size
                    )

                    self.initialized = True

                    logger.info(
                        "Sunshine transport monitor attached "
                        "to existing log file."
                    )

                    time.sleep(1)

                    continue
                
                current_size = (
                    log_path.stat().st_size
                )

                if current_size < self.position:
                    self.position = 0

                with open(
                    log_path,
                    "r",
                    encoding="utf-8",
                    errors="ignore",
                ) as file:

                    file.seek(
                        self.position
                    )

                    lines = (
                        file.readlines()
                    )

                    self.position = (
                        file.tell()
                    )

                for line in lines:

                    self._process_line(
                        line.strip()
                    )

            except Exception as error:

                logger.error(
                    f"Transport monitor error: "
                    f"{error}"
                )

            time.sleep(1)

    def _process_line(
        self,
        line: str,
    ):

        internal_api_url = (
            self._get_internal_api_url()
        )
        
        if (
            "CLIENT DISCONNECTED"
            in line
        ):

            logger.info(
                "Sunshine transport disconnected."
            )

            try:

                requests.post(
                    f"{internal_api_url}"
                    "/host/sunshine/"
                    "transport-disconnected",
                    timeout=2,
                )

            except Exception:
                pass

        elif (
            "CLIENT CONNECTED"
            in line
        ):

            logger.info(
                "Sunshine transport connected."
            )

            try:

                requests.post(
                    f"{internal_api_url}"
                    "/host/sunshine/"
                    "transport-connected",
                    timeout=2,
                )

            except Exception:
                pass

    def _get_log_path(
        self,
    ):

        try:

            config_path = (
                Path(__file__)
                .resolve()
                .parent
                .parent
                / "config.json"
            )

            if not config_path.exists():
                return None

            with open(
                config_path,
                "r",
                encoding="utf-8",
            ) as file:

                config = json.load(file)

            log_path = (
                config
                .get(
                    "sunshine",
                    {},
                )
                .get(
                    "log_path"
                )
            )

            if not log_path:
                return None

            return Path(log_path)

        except Exception:
            return None

    def _get_internal_api_url(
        self,
    ):

        try:

            config_path = (
                Path(__file__)
                .resolve()
                .parent
                .parent
                / "config.json"
            )

            if not config_path.exists():
                return (
                    "http://127.0.0.1:8100"
                )

            with open(
                config_path,
                "r",
                encoding="utf-8",
            ) as file:

                config = json.load(file)

            return (
                config
                .get(
                    "backend",
                    {},
                )
                .get(
                    "internal_api_url",
                    "http://127.0.0.1:8100",
                )
            )

        except Exception:
            return (
                "http://127.0.0.1:8100"
            )