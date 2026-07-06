import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from host_agent.config_manager import config_manager

class SessionLoggerAdapter(logging.LoggerAdapter):

    def process(self, msg, kwargs):
        extra = kwargs.setdefault("extra", {})

        default_extra = {
            "session_id": None,
            "game_id": None,
            "user_id": None,
        }

        for key, value in default_extra.items():
            extra.setdefault(key, value)

        return msg, kwargs

class SessionFormatter(
    logging.Formatter
):

    def format(self, record):

        parts = [
            f"[{self.formatTime(record)}]",
            f"[{record.levelname}]",
        ]

        if getattr(
            record,
            "session_id",
            None,
        ):
            parts.append(
                f"[session={record.session_id}]"
            )

        if getattr(
            record,
            "game_id",
            None,
        ):
            parts.append(
                f"[game={record.game_id}]"
            )

        if getattr(
            record,
            "user_id",
            None,
        ):
            parts.append(
                f"[user={record.user_id}]"
            )

        parts.append(
            record.getMessage()
        )

        return " ".join(parts)


def configure_logger() -> SessionLoggerAdapter:

    logger = logging.getLogger("host_agent")

    if logger.handlers:
        return SessionLoggerAdapter(logger, {})

    log_level = config_manager.get(
        "logging",
        "log_level",
        default="INFO",
    )

    logger.setLevel(
        getattr(
            logging,
            log_level.upper(),
            logging.INFO,
        )
    )


    log_dir = Path(
        config_manager.get(
            "logging",
            "log_dir",
            default="logs",
        )
    )
    log_dir.mkdir(parents=True, exist_ok=True)

    formatter = SessionFormatter()

    file_handler = RotatingFileHandler(
        log_dir / "host_agent.log",
        maxBytes=(
            config_manager.get(
                "logging",
                "max_log_size_mb",
                default=5,
            ) * 1_000_000
        ),
        backupCount=config_manager.get(
            "logging",
            "backup_count",
            default=5,
        ),
        encoding="utf-8",
    )

    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

    if config_manager.get(
        "logging",
        "console_logging",
        default=True,
    ):
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(
            formatter
        )

        logger.addHandler(
            console_handler
        )

    return SessionLoggerAdapter(logger, {})