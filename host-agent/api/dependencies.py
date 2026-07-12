from host_agent.startup_initializer import (
    initialize_startup,
)

initialize_startup()

from host_agent.startup_validator import (
    validate_startup,
)

validate_startup()

from host_agent.save_manager import SaveManager
from game_launcher import GameLauncher
from cleanup import CleanupManager
from host_agent.host_monitor import (
    HostMonitor,
)
from host_agent.sunshine_controller import (
    SunshineController,
)
from host_agent.tailscale_controller import (
    TailscaleController,
)
from host_agent.startup_manager import (
    StartupManager,
)
from host_agent.lifecycle_manager import (
    LifecycleManager,
)
from host_agent.watchdogs.sunshine_watchdog import (
    SunshineWatchdog,
)
from host_agent.watchdogs.tailscale_watchdog import (
    TailscaleWatchdog,
)
from host_agent.sunshine_stream_tracker import (
    sunshine_stream_tracker,
)

from host_agent.sunshine_transport_monitor import (
    SunshineTransportMonitor,
)

sunshine_transport_monitor = (
    SunshineTransportMonitor()
)

sunshine_watchdog = (
    SunshineWatchdog()
)
tailscale_watchdog = (
    TailscaleWatchdog()
)

tailscale_controller = (
    TailscaleController()
)

sunshine_controller = SunshineController()

save_manager = SaveManager()

game_launcher = GameLauncher()

host_monitor = HostMonitor()

cleanup_manager = CleanupManager(
    save_manager=save_manager,
    game_launcher=game_launcher
)

startup_manager = StartupManager(
    save_manager=save_manager,
    sunshine_controller=sunshine_controller,
    tailscale_controller=tailscale_controller,
    host_monitor=host_monitor,
)

lifecycle_manager = (
    LifecycleManager(
        startup_manager=
            startup_manager
    )
)