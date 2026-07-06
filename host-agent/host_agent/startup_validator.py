import re
import json
from pathlib import Path

from host_agent.config_manager import config_manager
from host_agent.logging_config import configure_logger

logger = configure_logger()

REQUIRED_CONFIG = {
    "sunshine": [
        "api_url",
        "username",
        "password",
        "path",
        "verify_ssl",
        "enabled",
        "close_stream_on_game_exit",
    ],

    "tailscale": [
        "ipn_path",
    ],
    
    "host_agent": [
        "host_name",
        "environment",
        "debug",
    ],

    "session": [
        "max_concurrent_sessions",
        "default_session_minutes",
        "warning_before_minutes",
        "auto_cleanup",
        "force_cleanup_timeout",
    ],

    "storage": [
        "saves_root",
        "temp_root",
        "backup_retention",
        "archive_retention",
        "enable_archives",
        "enable_integrity_hashing",
        "games_config_path",
    ],

    "metadata": [
        "metadata_path",
        "lock_file",
    ],

    "logging": [
        "log_dir",
        "log_level",
        "max_log_size_mb",
        "backup_count",
        "console_logging",
    ],

    "network": [
        "tailscale_enabled",
        "zerotier_enabled",
    ],

    "cloud_sync": [
        "enabled",
        "provider",
    ],
}

GAME_ID_PATTERN = re.compile(
    r"^[a-z0-9_]+$"
)
def validate_startup():

    def validate_config():

        config = config_manager.get_all()

        for section, keys in REQUIRED_CONFIG.items():

            if section not in config:
                raise RuntimeError(
                    f"Missing config section: {section}"
                )

            for key in keys:

                if key not in config[section]:
                    raise RuntimeError(
                        f"Missing config key: "
                        f"{section}.{key}"
                    )

        session = config["session"]

        duration = session["default_session_minutes"]
        warning = session["warning_before_minutes"]

        if duration < 5:
            raise RuntimeError(
                "Session duration must be greater than five."
            )

        if warning >= duration:
            raise RuntimeError(
                "Warning time must be less than "
                "session duration."
            )

        storage = config["storage"]

        if storage["backup_retention"] <= 0:
            raise RuntimeError(
                "backup_retention must be > 0"
            )

        if storage["archive_retention"] <= 0:
            raise RuntimeError(
                "archive_retention must be > 0"
            )

    def validate_games():

        games_path = Path("games.json")

        data = json.loads(
            games_path.read_text(
                encoding="utf-8"
            )
        )

        if "games" not in data:
            raise RuntimeError(
                "games.json missing games object."
            )

        for game_id, game in data["games"].items():

            if not GAME_ID_PATTERN.match(
                game_id
            ):
                raise RuntimeError(
                    f"Invalid game ID: {game_id}"
                )

            required = [
                "name",
                "exe_name",
                "exe_path",
                "save_path",
                "process_name",
                "save_filters",
            ]

            for field in required:

                if field not in game:
                    raise RuntimeError(
                        f"{game_id} missing "
                        f"{field}"
                    )

            save_filters = game[
                "save_filters"
            ]

            if save_filters["mode"] not in [
                "or",
                "and",
            ]:
                raise RuntimeError(
                    f"{game_id}: invalid "
                    "save filter mode."
                )

            for field in [
                "prefix",
                "contains",
                "suffix",
            ]:

                if not isinstance(
                    save_filters[field],
                    list,
                ):
                    raise RuntimeError(
                        f"{game_id}: "
                        f"{field} must "
                        "be a list."
                    )

    def validate_session_stats():

        path = Path(
            "data/session_stats.json"
        )

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        required = [
            "total_sessions",
            "successful_sessions",
            "failed_sessions",
            "recovered_sessions",
            "total_playtime_seconds",
        ]

        for key in required:

            if key not in data:
                raise RuntimeError(
                    f"session_stats missing "
                    f"{key}"
                )

    def validate_json_types():

        checks = {
            "data/active_sessions.json": dict,
            "data/session_history.json": list,
            "data/session_events.json": list,
            "data/recovery_events.json": list,
        }

        for file_path, expected_type in checks.items():

            data = json.loads(
                Path(file_path).read_text(
                    encoding="utf-8"
                )
            )

            if not isinstance(
                data,
                expected_type,
            ):
                raise RuntimeError(
                    f"{file_path} has invalid structure."
                )

    logger.info(
        "Running startup validation."
    )
    
    validate_config()
    validate_games()
    validate_session_stats()
    validate_json_types()

    logger.info(
        "Startup validation passed."
    )