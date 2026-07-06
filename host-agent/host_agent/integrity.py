import hashlib
from pathlib import Path

from host_agent.models import FileChangeSet, SaveFilters


class IntegrityManager:

    @staticmethod
    def calculate_file_hash(file_path: Path) -> str:

        sha256 = hashlib.sha256()

        with open(file_path, "rb") as file:

            while chunk := file.read(8192):
                sha256.update(chunk)

        return sha256.hexdigest()

    def calculate_directory_hash(
        self,
        directory: Path,
        save_filters: SaveFilters | None = None,
    ) -> str:

        sha256 = hashlib.sha256()

        for file in sorted(directory.rglob("*")):

            if file.is_file():

                if not self._should_include_file(
                    file.name,
                    save_filters,
                ):
                    continue
                
                sha256.update(
                    str(file.relative_to(directory)).encode()
                )

                sha256.update(
                    self.calculate_file_hash(file).encode()
                )

        return sha256.hexdigest()

    def verify_save_integrity(
        self,
        directory: Path,
        expected_hash: str,
    ) -> bool:

        current_hash = self.calculate_directory_hash(directory)

        return current_hash == expected_hash

    def detect_changed_files(
        self,
        old_dir: Path,
        new_dir: Path,
    ) -> FileChangeSet:

        old_files = {
            f.relative_to(old_dir): f
            for f in old_dir.rglob("*")
            if f.is_file()
        }

        new_files = {
            f.relative_to(new_dir): f
            for f in new_dir.rglob("*")
            if f.is_file()
        }

        changed = []
        new = []
        deleted = []

        for path, file in new_files.items():

            if path not in old_files:
                new.append(file)

            else:

                old_hash = self.calculate_file_hash(
                    old_files[path]
                )

                new_hash = self.calculate_file_hash(file)

                if old_hash != new_hash:
                    changed.append(file)

        for path, file in old_files.items():

            if path not in new_files:
                deleted.append(file)

        return FileChangeSet(
            changed=changed,
            new=new,
            deleted=deleted,
        )

    def _should_include_file(
        self,
        file_name: str,
        save_filters: SaveFilters | None,
    ) -> bool:

        if save_filters is None:
            return True

        if (
            not save_filters.prefix
            and not save_filters.contains
            and not save_filters.suffix
        ):
            return True

        prefix_match = (
            not save_filters.prefix
            or any(
                file_name.startswith(prefix)
                for prefix in save_filters.prefix
            )
        )

        contains_match = (
            not save_filters.contains
            or any(
                text in file_name
                for text in save_filters.contains
            )
        )

        suffix_match = (
            not save_filters.suffix
            or any(
                file_name.endswith(suffix)
                for suffix in save_filters.suffix
            )
        )

        if save_filters.mode == "and":

            matched = (
                prefix_match
                and contains_match
                and suffix_match
            )

        else:

            matched = (
                (
                    prefix_match
                    if save_filters.prefix
                    else False
                )
                or (
                    contains_match
                    if save_filters.contains
                    else False
                )
                or (
                    suffix_match
                    if save_filters.suffix
                    else False
                )
            )

        return matched