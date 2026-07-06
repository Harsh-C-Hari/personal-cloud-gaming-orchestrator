import logging

from host_agent.config_manager import (
    config_manager,
)


def apply_config_changes(
    section: str,
    changes: list[dict],
) -> None:

    if section == "logging":
        apply_logging_changes(
            changes
        )


def apply_logging_changes(
    changes: list[dict],
) -> None:

    for change in changes:

        if (
            change["setting"]
            == "log_level"
        ):

            logger = logging.getLogger(
                "host_agent"
            )

            new_level = config_manager.get(
                "logging",
                "log_level",
                default="INFO",
            )

            logger.setLevel(
                getattr(
                    logging,
                    new_level.upper(),
                    logging.INFO,
                )
            )