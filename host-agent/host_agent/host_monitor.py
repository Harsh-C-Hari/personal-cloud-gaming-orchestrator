from __future__ import annotations

import psutil
import GPUtil
import socket
import time
import sys
import platform
import subprocess


class HostMonitor:

    def __init__(self):
        self.cpu_name = self._get_cpu_name()
        self.gpu_info = self._get_gpu_info()

        self.integrated_gpu = (
            self.gpu_info["integrated_gpu"]
        )

        self.dedicated_gpu = (
            self.gpu_info["dedicated_gpu"]
        )
        self.disk_name = self._get_disk_name()
        self.machine_type = (
                "Laptop"
                if psutil.sensors_battery()
                else "Desktop"
        )
    def get_metrics(self):

        cpu = psutil.cpu_percent(
            interval=0.5
        )

        ram = psutil.virtual_memory()
        
        try:
            gpus = GPUtil.getGPUs()
            gpu_percent = (
                round(
                    gpus[0].load * 100,
                    1,
                )
                if gpus
                else None
            )

            gpu_memory_percent = (
                round(
                    gpus[0].memoryUtil * 100,
                    1,
                )
                if gpus
                else None
            )

        except Exception:

            gpu_percent = None
            gpu_memory_percent = None

        health = "healthy"

        if (ram.percent >= 95):
            health = "critical"

        if (
            ram.percent >= 85
            or cpu >= 85
        ):
            health = "warning"

        boot_time = psutil.boot_time()

        uptime_hours = round(
            (time.time() - boot_time) / 3600,
            1,
        )
        
        is_windows_11 = sys.getwindowsversion().build >= 22000
        
        if is_windows_11:
            os_version = "Windows 11"
        else:
            os_version = platform.release()
        
        disk = self.disk_usage()
        return {
            "hostname": socket.gethostname(),
            "os": platform.system(),
            "os_version": os_version,
            "machine_type": self.machine_type,
            "uptime_hours": uptime_hours,
            "health": health,
            "cpu_name": self.cpu_name,
            "cpu_percent": cpu,
            "cpu_cores": psutil.cpu_count(),

            "ram_percent": ram.percent,
            "ram_total_gb": round(
                ram.total / (1024**3),
                2,
            ),
            "ram_available_gb": round(
                ram.available / (1024**3),
                2,
            ),

            "disk_name": self.disk_name,
            "disk_percent": disk['percent'],
            "disk_free_gb": disk['free'],

            "integrated_gpu":
                self.integrated_gpu,

            "dedicated_gpu":
                self.dedicated_gpu,
            "gpu_class": (
                "Gaming"
                if self.dedicated_gpu
                else "Basic"
            ),
            "gpu_vendor": (
                "NVIDIA"
                if self.has_nvidia_gpu()
                else "Other"
            ),
            "gpu_percent": gpu_percent,
            "gpu_memory_percent": gpu_memory_percent,
            "gpu_temp": self.get_gpu_temperature(),
        }
    
    def _get_cpu_name(self):

        try:

            result = subprocess.run(
                [
                    "powershell",
                    "-Command",
                    "(Get-CimInstance Win32_Processor).Name",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )

            return result.stdout.strip()

        except Exception:

            return "Unknown CPU"
    
    def _get_disk_name(self):

        try:

            result = subprocess.run(
                [
                    "powershell",
                    "-Command",
                    "(Get-CimInstance Win32_DiskDrive).Model",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )

            return result.stdout.strip()

        except Exception:

            return "Unknown Disk"

    def _get_gpu_info(self):

        integrated_gpu = None
        dedicated_gpu = None

        try:

            result = subprocess.run(
                [
                    "powershell",
                    "-Command",
                    "(Get-CimInstance Win32_VideoController).Name"
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )

            gpu_names = [
                gpu.strip()
                for gpu in result.stdout.splitlines()
                if gpu.strip()
            ]

            for gpu in gpu_names:

                if (
                    "Intel" in gpu
                    or "Iris" in gpu
                    or "UHD" in gpu
                ):
                    integrated_gpu = gpu

                elif (
                    "NVIDIA" in gpu
                    or "GeForce" in gpu
                    or "RTX" in gpu
                    or "GTX" in gpu
                ):
                    dedicated_gpu = gpu

            return {
                "integrated_gpu":
                    integrated_gpu,

                "dedicated_gpu":
                    dedicated_gpu,
            }

        except Exception:

            return {
                "integrated_gpu": None,
                "dedicated_gpu": None,
            }
    
    
    def has_nvidia_gpu(self):

        return (
            self.dedicated_gpu is not None
            and (
                "NVIDIA" in self.dedicated_gpu
                or "GeForce" in self.dedicated_gpu
                or "RTX" in self.dedicated_gpu
                or "GTX" in self.dedicated_gpu
            )
        )
    def get_gpu_temperature(self):

        if not self.has_nvidia_gpu():
            return None

        try:

            gpu_temp_result = subprocess.run(
                [
                    "nvidia-smi",
                    "--query-gpu=temperature.gpu",
                    "--format=csv,noheader,nounits",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )

            return int(
                gpu_temp_result.stdout.strip()
            )

        except Exception:

            return None
    
    def get_capabilities(self):

        return {
            "cpu_cores": psutil.cpu_count(),
            "ram_total_gb": round(
                psutil.virtual_memory().total
                / (1024 ** 3),
                2,
            ),
            "gpu_available": (
                self.dedicated_gpu is not None
                or self.integrated_gpu is not None
            ),
        }
    
    def disk_usage(self):
        total_bytes = 0
        used_bytes = 0
        free_bytes = 0

        for partition in psutil.disk_partitions():
            if "opts" in partition.opts or not partition.fstype:
                continue

            try:
                partition_usage = psutil.disk_usage(partition.mountpoint)

                total_bytes += partition_usage.total
                used_bytes += partition_usage.used
                free_bytes += partition_usage.free

            except PermissionError:
                continue

        gb = 1024**3
        return {
            "total": round(total_bytes / gb, 2),
            "used": round(used_bytes / gb, 2),
            "free": round(free_bytes / gb, 2),
            "percent": (
                round((used_bytes / total_bytes) * 100, 1) if total_bytes > 0 else 0
            ),
        }