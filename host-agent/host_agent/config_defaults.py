DEFAULT_CONFIG = {
    "sunshine": {
        "api_url": "https://localhost:47990",
        "username": "",
        "password": "",
        "path": "",
        "verify_ssl": False,
        "enabled": True,
        "close_stream_on_game_exit": True,
    },

    "tailscale": {
        "ipn_path": ""
    },

    "host_agent": {
        "host_name": "pcgo-host",
        "environment": "production",
        "debug": False,
    },

    "session": {
        "max_concurrent_sessions": 1,
        "default_session_minutes": 60,
        "warning_before_minutes": 5,
        "auto_cleanup": True,
        "force_cleanup_timeout": 30,
    },

    "storage": {
        "saves_root": "saves",
        "temp_root": "host_saves",
        "backup_retention": 10,
        "archive_retention": 10,
        "enable_archives": True,
        "enable_integrity_hashing": True,
        "games_config_path": "games.json",
    },

    "metadata": {
        "metadata_path": "metadata/session_metadata.json",
        "lock_file": "metadata/session.lock",
    },

    "logging": {
        "log_dir": "logs",
        "log_level": "INFO",
        "max_log_size_mb": 5,
        "backup_count": 5,
        "console_logging": True,
    },

    "network": {
        "tailscale_enabled": True,
        "zerotier_enabled": False,
    },

    "cloud_sync": {
        "enabled": False,
        "provider": "none",
    },
}