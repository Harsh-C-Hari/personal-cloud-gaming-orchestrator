CONFIG_SCHEMA = {
    "sunshine": {
        "api_url": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        },
        "username": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        },
        "password": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        },
        "path": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        },

        # Core service.
        "enabled": {
            "editable": False,
        },

        "verify_ssl": {
            "editable": True,
            "requires_restart": False,
            "type": bool,
        },

        "close_stream_on_game_exit": {
            "editable": True,
            "requires_restart": False,
            "type": bool,
        },
    },

    "tailscale": {
        "ipn_path": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        }
    },

    "host_agent": {
        "host_name": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        },

        "environment": {
            "editable": True,
            "requires_restart": True,
            "type": str,
        },

        "debug": {
            "editable": True,
            "requires_restart": True,
            "type": bool,
        },
    },

    "session": {
        "max_concurrent_sessions": {
            "editable": True,
            "requires_restart": False,
            "type": int,
        },

        "default_session_minutes": {
            "editable": True,
            "requires_restart": False,
            "type": int,
        },

        "warning_before_minutes": {
            "editable": True,
            "requires_restart": False,
            "type": int,
        },

        "auto_cleanup": {
            "editable": True,
            "requires_restart": False,
            "type": bool,
        },

        "force_cleanup_timeout": {
            "editable": True,
            "requires_restart": False,
            "type": int,
        },
    },

    "storage": {

        # Internal paths.
        "saves_root": {
            "editable": False,
        },

        "temp_root": {
            "editable": False,
        },

        "games_config_path": {
            "editable": False,
        },

        "backup_retention": {
            "editable": True,
            "requires_restart": True,
            "type": int,
        },

        "archive_retention": {
            "editable": True,
            "requires_restart": True,
            "type": int,
        },

        "enable_archives": {
            "editable": True,
            "requires_restart": True,
            "type": bool,
        },

        "enable_integrity_hashing": {
            "editable": True,
            "requires_restart": True,
            "type": bool,
        },
    },

    "metadata": {

        # Critical internal files.
        "metadata_path": {
            "editable": False,
        },

        "lock_file": {
            "editable": False,
        },
    },

    "logging": {
        "log_level": {
            "editable": True,
            "requires_restart": False,
            "type": str,
        },

        "console_logging": {
            "editable": True,
            "requires_restart": True,
            "type": bool,
        },

        "log_dir": {
            "editable": False,
        },

        "max_log_size_mb": {
            "editable": False,
        },

        "backup_count": {
            "editable": False,
        },
    },

    "network": {

        # Tailscale is a core dependency.
        "tailscale_enabled": {
            "editable": False,
        },

        "zerotier_enabled": {
            "editable": False,
        },
    },

    "cloud_sync": {
        "enabled": {
            "editable": True,
            "requires_restart": True,
            "type": bool,
        },

        "provider": {
            "editable": True,
            "requires_restart": True,
            "type": str,
        },
    },
}