import copy
from fastapi import APIRouter, HTTPException

from host_agent.config_manager import config_manager
from api.config_schema import CONFIG_SCHEMA
from host_agent.logging_config import configure_logger
from api.config_validator import (
    validate_config_section,
)
from host_agent.config_runtime import (
    apply_config_changes,
)

router = APIRouter(
    prefix="/config",
    tags=["Configuration"],
)


logger = configure_logger()

@router.get("/")
def get_config():

    config = config_manager.get_all()

    response = {}

    for section, values in config.items():

        response[section] = {}

        for key, value in values.items():

            rules = CONFIG_SCHEMA.get(
                section,
                {},
            ).get(
                key,
                {},
            )

            response[section][key] = {
                "value": value,
                "editable": rules.get(
                    "editable",
                    False,
                ),
                "requires_restart": rules.get(
                    "requires_restart",
                    False,
                ),
            }

    return response

@router.post("/reload")
def reload_configuration():

    config_manager.reload()

    logger.warning(
        "Configuration manually reloaded."
    )

    return {
        "success": True,
        "message":
            "Configuration reloaded successfully",
    }

@router.put("/{section}")
def update_config(
    section: str,
    values: dict,
):

    current_config = config_manager.get_all()

    if section not in current_config:
        raise HTTPException(
            status_code=404,
            detail="Configuration section not found.",
        )

    rules = CONFIG_SCHEMA.get(
        section,
        {},
    )

    current_values = current_config[section]

    updated_values = copy.deepcopy(
        current_values
    )

    changes = []

    for key, new_value in values.items():

        if key not in rules:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unknown setting: "
                    f"{section}.{key}"
                ),
            )


        setting = rules[key]


        if not setting.get(
            "editable",
            False,
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    f"{section}.{key} "
                    "is read-only."
                ),
            )


        expected_type = setting.get("type")


        if expected_type is int:

            if type(new_value) is not int:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{section}.{key} "
                        f"must be "
                        f"{expected_type.__name__}."
                    ),
                )

        elif expected_type is bool:

            if type(new_value) is not bool:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{section}.{key} "
                        f"must be "
                        f"{expected_type.__name__}."
                    ),
                )
        
        elif (
            expected_type
            and not isinstance(
                new_value,
                expected_type,
            )
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{section}.{key} "
                    f"must be "
                    f"{expected_type.__name__}."
                ),
            )


        old_value = current_values.get(
            key,
        )


        if old_value != new_value:

            changes.append(
                (
                    key,
                    old_value,
                    new_value,
                    setting.get(
                        "requires_restart",
                        False,
                    ),
                )
            )


            updated_values[key] = new_value


    if not changes:
        return {
            "success": True,
            "message": "No changes detected.",
        }


    validate_config_section(
        section,
        updated_values,
    )
    
    config_manager.update(
        section,
        updated_values,
    )

    apply_config_changes(
        section,
        [
            {
                "setting": key,
                "old": old,
                "new": new,
                "requires_restart": restart,
            }
            for (
                key,
                old,
                new,
                restart,
            ) in changes
        ]
    )


    logger.warning(
        "Configuration updated: "
        f"{section}"
    )


    for (
        key,
        old_value,
        new_value,
        requires_restart,
    ) in changes:

        logger.warning(
            f"{section}.{key}: "
            f"{old_value} -> {new_value}"
            + (
                " (restart required)"
                if requires_restart
                else ""
            )
        )

    config_manager.reload()
    return {
        "success": True,
        "message": (
            "Configuration updated successfully."
        ),
        "changes": [
            {
                "setting": key,
                "old": old,
                "new": new,
                "requires_restart": restart,
            }
            for (
                key,
                old,
                new,
                restart,
            ) in changes
        ],
    }