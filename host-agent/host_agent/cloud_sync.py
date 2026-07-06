from abc import ABC, abstractmethod
from pathlib import Path


class CloudSyncProvider(ABC):

    @abstractmethod
    def upload_save_archive(
        self,
        archive_path: Path,
        user_id: str,
        game_id: str,
    ) -> None:
        pass

    @abstractmethod
    def download_save_archive(
        self,
        user_id: str,
        game_id: str,
        destination: Path,
    ) -> Path:
        pass

    @abstractmethod
    def delete_cloud_save(
        self,
        user_id: str,
        game_id: str,
    ) -> None:
        pass