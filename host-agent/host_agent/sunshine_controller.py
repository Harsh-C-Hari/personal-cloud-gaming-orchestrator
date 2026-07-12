import subprocess
import time
from pathlib import Path
from api.services.sunshine_service import (
    get_sunshine_apps,
    get_sunshine_clients,
    is_sunshine_process_running,
    get_sunshine_config,
    pair_client,
    unpair_client,
    unpair_all_clients,
    get_stream_history,
    close_stream,
)
from host_agent.logging_config import configure_logger

logger = configure_logger()



class SunshineController:
    
    def _kill_process(
        self,
        process_name: str,
    ):
        try:
            subprocess.run(
                [
                    "taskkill",
                    "/F",
                    "/IM",
                    process_name,
                ],
                capture_output=True,
                text=True,
            )
        except Exception as e:
            logger.error(
                f"Failed killing process "
                f"{process_name}: {e}"
            )

    def status(self):

        clients = get_sunshine_clients()
        apps = get_sunshine_apps()

        return {
            "configured": self.configured(),
            "running": is_sunshine_process_running(),
            "reachable": clients["reachable"],
            "client_count": len(
                clients.get(
                    "clients",
                    [],
                )
            ),
            "app_count": len(
                apps.get(
                    "apps",
                    [],
                )
            ),
            "error": (
                clients["error"]
                or apps["error"]
            ),
        }

    def start(self):

        if not self.configured():

            return {
                "success": False,
                "running": False,
                "message":
                    "Sunshine is not configured.",
            }
        
        if is_sunshine_process_running():
            return {
                "success": True,
                "running": is_sunshine_process_running(),
                "message": "Sunshine already running",
            }

        exe = self.executable()

        if not exe:

            return {
                "success": False,
                "message":
                    "Sunshine is not configured.",
            }

        if not exe.exists():

            return {
                "success": False,
                "message":
                    f"Sunshine executable not found: {exe}",
            }

        try:
            subprocess.Popen(
                [str(exe)],
                cwd=str(exe.parent),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=(
                    subprocess.CREATE_NEW_PROCESS_GROUP
                    | subprocess.DETACHED_PROCESS
                )
            )

            for _ in range(20):

                if is_sunshine_process_running():
                    break

                time.sleep(0.5)

            running = is_sunshine_process_running()

            return {
                "success": running,
                "running": is_sunshine_process_running(),
                "message": (
                    "Sunshine started successfully"
                    if running
                    else "Sunshine failed to start"
                ),
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e),
            }

    def stop(self):

        if not self.configured():

            return {
                "success": False,
                "running": False,
                "message":
                    "Sunshine is not configured.",
            }
        
        try:
            self._kill_process("sunshine.exe")
            self._kill_process("sunshines-gpu.exe")

            for _ in range(20):

                running = is_sunshine_process_running()

                reachable = get_sunshine_clients()[
                    "reachable"
                ]

                if (
                    not running
                    and not reachable
                ):
                    break

                time.sleep(0.5)

            running = is_sunshine_process_running()

            return {
                "success": not running,
                "running": is_sunshine_process_running(),
                "message": (
                    "Sunshine stopped successfully"
                    if not running
                    else "Failed to stop Sunshine"
                ),
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e),
            }

    def restart(self):

        stop_result = self.stop()

        if not stop_result["success"]:
            return stop_result

        return self.start()

    def can_stop(self):
        return False

    def configured(self):

        path = get_sunshine_config().get(
            "path"
        )

        return bool(path)

    def executable(self):

        path = get_sunshine_config().get(
            "path"
        )

        return (
            Path(path)
            if path
            else None
        )

    def pair_client(
        self,
        pin: str,
    ):
        return pair_client(pin)

    def unpair_client(
        self,
        uuid: str,
    ):
        return unpair_client(uuid)

    def unpair_all_clients(
        self,
    ):
        return unpair_all_clients()

    def get_clients(self):
        return get_sunshine_clients()

    def get_stream_history(
        self,
        limit: int = 50,
    ):
        return get_stream_history(limit=limit)

    def close_stream(self):

        result = close_stream()

        return {
            "success":
                result["success"],
            "message": (
                "Stream closed successfully"
                if result["success"]
                else result["error"]
            ),
        }