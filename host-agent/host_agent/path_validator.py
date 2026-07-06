from pathlib import Path

from host_agent.models import GameConfig


class PathValidator:

    def __init__(
        self,
        saves_root: Path,
        temp_root: Path,
    ) -> None:

        self.saves_root = saves_root
        self.temp_root = temp_root

    def validate_safe_path(
        self,
        target: Path,
        game_configs: list[GameConfig],
    ) -> None:

        target = target.resolve()

        allowed_paths = [
            self.saves_root.resolve(),
            self.temp_root.resolve(),
        ]

        for config in game_configs:
            allowed_paths.append(
                Path(config.save_path).resolve()
            )

        for allowed in allowed_paths:

            try:
                target.relative_to(allowed)
                return

            except ValueError:
                continue

        raise ValueError(
            f"Unsafe path operation blocked: {target}"
        )

    INVALID_NAMES = {
        "",
        ".",
        "..",
    }

    INVALID_CHARS = {
        "/",
        "\\",
        ":",
        "*",
        "?",
        "\"",
        "<",
        ">",
        "|",
    }


    def validate_path_component(
        self,
        value: str,
    ) -> None:

        value = value.strip()

        if value in self.INVALID_NAMES:
            raise ValueError(
                f"Invalid path component: {value}"
            )

        for char in self.INVALID_CHARS:

            if char in value:
                raise ValueError(
                    f"Unsafe path component: {value}"
                )