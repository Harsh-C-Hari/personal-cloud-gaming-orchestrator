from fastapi import HTTPException
from pathlib import Path


def validate_config_section(
    section: str,
    values: dict,
):
    if section == "session":

        duration = values.get(
            "default_session_minutes"
        )

        warning = values.get(
            "warning_before_minutes"
        )


        if (
            duration is not None
            and duration < 5
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Session duration "
                    "must be greater than five."
                ),
            )


        if (
            warning is not None
            and warning < 0
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Warning time cannot be negative."
                ),
            )


        if (
            duration is not None
            and warning is not None
            and warning >= duration
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Warning time must be "
                    "less than session duration."
                ),
            )


    elif section == "sunshine":

        path = values.get("path")

        if (
            path
            and not Path(path).exists()
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Sunshine executable "
                    "path does not exist."
                ),
            )


        if (
            path
            and not path.lower().endswith(".exe")
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Sunshine path must "
                    "point to an executable."
                ),
            )

    elif section == "tailscale":

        ipn_path = values.get("ipn_path")

        if (
            ipn_path
            and not Path(ipn_path).exists()
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tailscale IPN executable "
                    "path does not exist."
                ),
            )


        if (
            ipn_path
            and not ipn_path.lower().endswith(".exe")
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tailscale IPN path must "
                    "point to an executable."
                ),
            )
    
    elif section == "logging":

        level = values.get("log_level")

        valid_levels = [
            "DEBUG",
            "INFO",
            "WARNING",
            "ERROR",
            "CRITICAL",
        ]


        if (
            level
            and level.upper()
            not in valid_levels
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid log level."
                ),
            )