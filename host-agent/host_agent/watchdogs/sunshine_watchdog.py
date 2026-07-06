import threading
import time

from host_agent.sunshine_controller import (
    SunshineController,
)

from host_agent.logging_config import (
    configure_logger,
)
from host_agent.recovery_event_manager import (
    append_recovery_event,
)

logger = configure_logger()

class SunshineWatchdog:

    def __init__(self):

        self.sunshine_controller = SunshineController()
        self.running = False
        self.restart_attempts = 1
        self.max_restart_attempts = 3

    def start(self):

        if self.running:
            return

        self.running = True

        threading.Thread(
            target=self._loop,
            daemon=True,
        ).start()

    def _loop(self):

        while self.running:

            try:

                status = self.sunshine_controller.status()

                if not status["configured"]:

                    time.sleep(30)

                    continue
                
                if not status["running"]:

                    logger.warning(
                        "Sunshine watchdog detected outage."
                    )

                    append_recovery_event(
                        "sunshine",
                        "detected_offline",
                    )

                    logger.warning(
                        "Attempting Sunshine recovery."
                    )

                    append_recovery_event(
                        "sunshine",
                        "restart_attempt",
                    )
                    
                    if (
                        self.restart_attempts
                        > self.max_restart_attempts
                    ):

                        logger.error(
                            "Sunshine watchdog reached maximum restart attempts."
                        )
                        append_recovery_event(
                            "sunshine",
                            "max_restart_attempts_reached",
                        )

                        time.sleep(30)

                        continue
                    
                    result = (
                        self.sunshine_controller.start()
                    )
                    if result['success']:
                        append_recovery_event(
                            "sunshine",
                            "restart_success",
                            {
                                "attempt":
                                    self.restart_attempts,
                            }
                        )
                        self.restart_attempts = 1
                    else:
                        append_recovery_event(
                            "sunshine",
                            "restart_failed",
                        )
                        self.restart_attempts += 1

                    logger.info(f"Sunshine Started : {result['success']}")

                else:

                    self.restart_attempts = 1

            except Exception as error:

                logger.error(
                    f"Sunshine watchdog error: {error}"
                )

            time.sleep(30)

    def status(self):

        return {
            "configured":
                self.sunshine_controller.configured,
            
            "running":
                self.running,

            "restart_attempts":
                self.restart_attempts,

            "max_restart_attempts":
                self.max_restart_attempts,
        }