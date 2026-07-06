import json
import copy
import os
from pathlib import Path
from typing import Any


class ConfigManager:

    def __init__(
        self,
        config_path: str = "config.json",
    ) -> None:

        self.config_path = Path(config_path)

        self.config: dict = {}

        self.reload()


    def reload(self) -> None:

        if not self.config_path.exists():
            raise FileNotFoundError(
                "Configuration file not found: "
                f"{self.config_path}"
            )


        try:
            with self.config_path.open(
                "r",
                encoding="utf-8",
            ) as file:

                self.config = json.load(file)

        except FileNotFoundError:
            raise FileNotFoundError(
                "Configuration file not found: "
                f"{self.config_path}"
            )

        except json.JSONDecodeError as e:

            raise ValueError(
                f"Configuration file JSON Decode Error: {e}"
                f"{self.config_path}"
            )


    def get(
        self,
        *keys: str,
        default: Any = None,
    ) -> Any:

        value = self.config

        for key in keys:

            if not isinstance(
                value,
                dict,
            ):
                return default


            value = value.get(key)


            if value is None:
                return default


        return value


    def get_all(self) -> dict:

        return copy.deepcopy(self.config)

    def save(self) -> None:

        temp_path = self.config_path.with_suffix(
            ".tmp"
        )

        with temp_path.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                self.config,
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp_path.replace(
            self.config_path
        )

    def update(
        self,
        section: str,
        values: dict,
    ) -> None:

        if section not in self.config:
            raise KeyError(
                f"Unknown config section: {section}"
            )

        self.config[section].update(
            values
        )

        self.save()


config_manager = ConfigManager()