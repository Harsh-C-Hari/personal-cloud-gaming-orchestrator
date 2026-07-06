from __future__ import annotations

import subprocess
from pathlib import Path
import json
from host_agent.config_manager import config_manager

class TailscaleController:

    def status(self):
        
        return (
            self.detailed_status()[
                "healthy"
            ]
        )

    def connect(self):
        raise NotImplementedError

    def disconnect(self):
        raise NotImplementedError

    def get_ip(self):
        raise NotImplementedError


    def health(self):

        return {
            "connected": self.status(),
        }

    def detailed_status(self):

        try:

            result = subprocess.run(
                ["tailscale", "status", "--json"],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if result.returncode != 0:
                return {
                    "healthy": False,
                    "backend_state": "unknown",
                    "service_running": self.service_running(),
                    "ipn_running": self.ipn_running(),
                    "health": [],
                    "user_authenticated": False,
                    "tailscale_ips": None,
                }

            data = json.loads(
                result.stdout
            )

            return {
                "ipn_running":
                    self.ipn_running(),
                
                "healthy":
                    data.get(
                        "BackendState"
                    ) == "Running",

                "backend_state":
                    data.get(
                        "BackendState"
                    ),

                "health":
                    data.get(
                        "Health",
                        [],
                    ),   

                "service_running": self.service_running(),

                "user_id":
                    data.get(
                        "Self",
                        {},
                    ).get(
                        "UserID"
                    ),

                "user_authenticated":
                (
                    data.get(
                        "Self",
                        {},
                    ).get(
                        "UserID",
                        0,
                    )
                    != 0
                ),

                "tailscale_ips":
                    data.get(
                        "TailscaleIPs"
                    ),

                "current_tailnet":
                    data.get(
                        "CurrentTailnet"
                    ),

                "configured":
                    self.configured(),

                "ipn_recovery_enabled":
                    self.configured(),
            }

        except Exception as error:

            return {
                "healthy": False,
                "configured": self.configured(),
                "backend_state": "unknown",
                "service_running": self.service_running(),
                "ipn_running": self.ipn_running(),
                "health": [str(error)],
                "user_authenticated": False,
                "tailscale_ips": None,
            }

    def ipn_running(self):

        try:

            result = subprocess.run(
                [
                    "tasklist",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )

            return (
                "tailscale-ipn.exe"
                in result.stdout.lower()
            )

        except Exception:

            return False

    def start_ipn(self):

        if self.ipn_running():
            return True

        ipn = self.ipn_executable()

        if not ipn:

            return False

        if not ipn.exists():

            return False
        
        try:

            subprocess.Popen(
                [ipn],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                creationflags=(
                    subprocess.CREATE_NEW_PROCESS_GROUP
                    |
                    subprocess.DETACHED_PROCESS
                ),
            )

            return True

        except Exception:
            return False
        
    def service_running(self):

        try:

            result = subprocess.run(
                [
                    "powershell",
                    "-Command",
                    "(Get-Service Tailscale).Status"
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )

            return (
                "Running"
                in result.stdout
            )

        except Exception:
            return False

    def start_service(self):

        try:

            subprocess.run(
                [
                    "powershell",
                    "-Command",
                    "Start-Service Tailscale",
                ],
                timeout=15,
                capture_output=True,
                text=True,
            )

            return True

        except Exception:

            return False

    def up(self):

        try:

            result = subprocess.run(
                ["tailscale", "up"],
                capture_output=True,
                text=True,
                timeout=60,
            )

            return result.returncode == 0

        except Exception:

            return False

    def configured(self):

        config = config_manager.get(
            "tailscale"
        )

        path = config.get(
            "ipn_path"
        )

        return (
            bool(path)
            and
            Path(path).exists()
        )

    def ipn_executable(self):

        path = config_manager.get(
            "tailscale",
            "ipn_path",
        )

        return (
            Path(path)
            if path
            else None
        )