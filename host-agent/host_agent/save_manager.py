from __future__ import annotations

import json
import shutil
import time
import os
import zipfile
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
from uuid import uuid4

from host_agent.config_manager import config_manager
from host_agent.integrity import IntegrityManager
from host_agent.logging_config import configure_logger
from host_agent.metadata_manager import MetadataManager
from host_agent.models import (
    GameConfig,
    SaveFilters,
    HealthStatus,
    SessionMetadata,
    SessionState,
)
from host_agent.path_validator import PathValidator
from host_agent.session_lock import SessionLockManager
from host_agent.stability_monitor import (
    FileStabilityMonitor,
)
from host_agent.live_sync import LiveSyncManager

logger = configure_logger()

class SaveManager:
    """
    Orchestrates the full session save lifecycle.

    This class contains ZERO low-level logic.
    All operations are delegated to sub-managers:
      - SessionLockManager  → session locking
      - MetadataManager     → session metadata CRUD
      - IntegrityManager    → file hashing
      - PathValidator       → safe path enforcement
      - FileStabilityMonitor → save file stabilization
    """

    def __init__(self) -> None:

        self.saves_root = Path(
            config_manager.get(
                "storage",
                "saves_root",
            )
        )

        self.temp_root = Path(
            config_manager.get(
                "storage",
                "temp_root",
            )
        )

        self.backup_retention = config_manager.get(
            "storage", "backup_retention"
        )

        self.archive_retention = config_manager.get(
            "storage",
            "archive_retention",
        )

        self.enable_archives = config_manager.get(
            "storage", "enable_archives"
        )

        self.enable_hashing = config_manager.get(
            "storage", "enable_integrity_hashing"
        )

        metadata_path = Path(
            config_manager.get(
                "metadata", "metadata_path"
            )
        )

        lock_file = Path(
            config_manager.get(
                "metadata", "lock_file"
            )
        )

        self.saves_root.mkdir(
            parents=True, exist_ok=True
        )

        self.temp_root.mkdir(
            parents=True, exist_ok=True
        )

        # Internal temporary storage for active session
        # backups. This path is intentionally fixed and
        # not user configurable.
        BASE_DIR = Path(__file__).resolve().parent.parent

        self.host_saves = (
            BASE_DIR /
            "host_saves"
        )

        self.host_saves.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.lock_manager = SessionLockManager(
            lock_file_path=lock_file,
        )

        self.metadata_manager = MetadataManager(
            metadata_path=metadata_path,
        )

        self.integrity = IntegrityManager()

        self.stability = FileStabilityMonitor()

        self.live_sync = LiveSyncManager(self)

        self.game_configs = self._load_game_configs()

        self.path_validator = PathValidator(
            saves_root=self.saves_root,
            temp_root=self.temp_root,
        )

        self.backup_error = None
        self.archive_error = None
        
        logger.info(
            f"SaveManager initialized. "
            f"Games loaded: "
            f"{list(self.game_configs.keys())}"
        )

    # ──────────────────────────────────────────
    # Game Config Loading
    # ──────────────────────────────────────────

    def _load_game_configs(
        self,
    ) -> Dict[str, GameConfig]:

        games_path = Path(
            config_manager.get(
                "storage",
                "games_config_path",
            )
        )

        if not games_path.exists():

            logger.warning(
                f"Games config not found: "
                f"{games_path}"
            )

            return {}

        with open(
            games_path,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        configs = {}

        for game_id, game_data in data.get(
            "games", {}
        ).items():

            filters = game_data.get(
                "save_filters",
                {}
            )

            save_filters = SaveFilters(
                mode=filters.get("mode", ""),
                prefix=filters.get("prefix", []),
                contains=filters.get("contains", []),
                suffix=filters.get("suffix", []),
            )
            configs[game_id] = GameConfig(
                id=game_id,
                name=game_data["name"],
                exe_name=game_data["exe_name"],
                exe_path=game_data["exe_path"],
                save_path=game_data["save_path"],
                process_name=game_data["process_name"],
                save_filters=save_filters,
            )

        return configs

    def get_game_config(
        self,
        game_id: str,
    ) -> GameConfig:

        if game_id not in self.game_configs:

            raise ValueError(
                f"Unknown game_id: {game_id}. "
                f"Available: "
                f"{list(self.game_configs.keys())}"
            )

        return self.game_configs[game_id]

    def reload_game_configs(self) -> None:

        self.game_configs = (
            self._load_game_configs()
        )

        logger.info(
            "Game configurations reloaded. "
            f"Loaded games: "
            f"{list(self.game_configs.keys())}"
        )

    def save_game_configs(
        self,
        games: dict,
    ) -> None:

        games_path = Path(
            config_manager.get(
                "storage",
                "games_config_path",
            )
        )

        temp_path = games_path.with_suffix(
            ".tmp"
        )

        with temp_path.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                {
                    "games": games
                },
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp_path.replace(
            games_path
        )

        self.reload_game_configs()
    
    # ──────────────────────────────────────────
    # Session Lock
    # ──────────────────────────────────────────

    def create_session_lock(
        self,
        user_id: str,
        game_id: str,
    ) -> str:

        session_id = str(uuid4())[:8]

        self.lock_manager.acquire(
            session_id=session_id,
            user_id=user_id,
            game_id=game_id,
        )

        return session_id

    def release_session_lock(
        self,
        session_id: str,
    ) -> None:

        self.lock_manager.release(session_id)

    def is_session_locked(self) -> bool:
        return self.lock_manager.is_locked()

    # ──────────────────────────────────────────
    # Save Path Helpers
    # ──────────────────────────────────────────

    def _user_save_dir(
        self,
        user_id: str,
        game_id: str,
    ) -> Path:

        self.path_validator.validate_path_component(
            user_id
        )

        self.path_validator.validate_path_component(
            game_id
        )

        root = self.saves_root.resolve()

        path = (
            root
            / user_id
            / game_id
        ).resolve()

        if root not in path.parents:
            raise RuntimeError(
                "Path traversal detected."
            )

        return path

    def _latest_dir(
        self,
        user_id: str,
        game_id: str,
    ) -> Path:
        return (
            self._user_save_dir(user_id, game_id)
            / "latest"
        )

    def replace_latest_saves(
        self,
        source: Path,
        destination: Path,
    ) -> None:

        temp_destination = destination.with_name(
            destination.name + "_tmp"
        )

        if temp_destination.exists():
            shutil.rmtree(temp_destination)

        temp_destination.mkdir(
            parents=True,
            exist_ok=True,
        )

        # Copy everything to temporary folder

        try:
        
            for item in source.iterdir():

                dst = temp_destination / item.name

                if item.is_dir():

                    shutil.copytree(
                        item,
                        dst,
                        dirs_exist_ok=True,
                    )

                else:

                    shutil.copy2(
                        item,
                        dst,
                    )

        except:

            shutil.rmtree(temp_destination, ignore_errors=True)

            raise

        # Remove old latest

        if destination.exists():

            shutil.rmtree(destination)

        # Atomic rename

        temp_destination.replace(
            destination
        )

    def _latest_hash_file(
        self,
        user_id: str,
        game_id: str,
    ) -> Path:

        return (
            self._user_save_dir(
                user_id,
                game_id,
            )
            / "latest.hash"
        )

    def _backups_dir(
        self,
        user_id: str,
        game_id: str,
    ) -> Path:
        return (
            self._user_save_dir(user_id, game_id)
            / "backups"
        )

    def _archives_dir(
        self,
        user_id: str,
        game_id: str,
    ) -> Path:
        return (
            self._user_save_dir(user_id, game_id)
            / "archives"
        )

    def _game_save_root(
        self,
        user_id: str,
        game_id: str,
    ) -> Path:

        return self._user_save_dir(
            user_id,
            game_id,
        )

    def _temp_session_dir(
        self,
        session_id: str,
    ) -> Path:
        return self.host_saves / session_id

    def _original_backup_dir(
        self,
        session_id: str,
    ) -> Path:
        return (
            self._temp_session_dir(session_id)
            / "original_backup"
        )

    # ──────────────────────────────────────────
    # Full Session Start (inject_saves)
    # ──────────────────────────────────────────

    def inject_saves(
        self,
        user_id: str,
        game_id: str,
        load_save: str | None = None,
    ) -> str:
        """
        Full session start sequence:
          1. Create session lock
          2. Create session metadata
          3. Backup original game saves
          4. Inject user's isolated saves
          5. Return session_id
        """
        
        game_config = self.get_game_config(
            game_id
        )

        game_save_path = Path(game_config.save_path)

        session_id = self.create_session_lock(
            user_id=user_id,
            game_id=game_id,
        )

        now = int(time.time())

        metadata = SessionMetadata(
            session_id=session_id,
            user_id=user_id,
            game_id=game_id,
            exe_name=game_config.exe_name,
            game_save_path=str(game_save_path),
            backup_path=str(
                self._original_backup_dir(
                    session_id
                )
            ),
            state=SessionState.INITIALIZING.value,
            created_at=now,
            updated_at=now,
            live_sync_triggered=False,
            live_sync_count=0,
            live_sync_preserved=False,
        )

        self.metadata_manager.save_session(
            session_id=session_id,
            metadata=metadata,
        )

        try:

            self.backup_original_saves(
                session_id=session_id,
                game_config=game_config,
            )

            self.inject_user_saves(
                session_id=session_id,
                user_id=user_id,
                game_config=game_config,
                load_save=load_save,
            )

        except Exception as error:

            logger.error(
                f"Save injection failed: {error}",
                extra={
                    "session_id": session_id,
                    "user_id": user_id,
                    "game_id": game_id,
                },
            )

            try:

                self.restore_original_saves(
                    session_id
                )

            except Exception as restore_error:

                logger.error(
                    f"Restore failed after injection failure: "
                    f"{restore_error}",
                    extra={
                        "session_id": session_id,
                        "user_id": user_id,
                        "game_id": game_id,
                    },
                )
            
            self._set_state(
                session_id,
                SessionState.FAILED,
            )

            self.lock_manager.release(session_id)

            raise

        logger.info(
            f"Saves injected successfully. "
            f"Session: {session_id}",
            extra={
                "session_id": session_id,
                "user_id": user_id,
                "game_id": game_id,
            },
        )

        return session_id

    # ──────────────────────────────────────────
    # Backup Original Saves
    # ──────────────────────────────────────────

    def backup_original_saves(
        self,
        session_id: str,
        game_config: GameConfig,
    ) -> None:

        game_save_path = Path(
            game_config.save_path
        )

        backup_dir = self._original_backup_dir(
            session_id
        )

        if game_save_path.exists():

            logger.info(
                f"Backing up original saves: "
                f"{game_save_path} → {backup_dir}",
                extra={
                    "session_id": session_id
                },
            )

            shutil.copytree(
                game_save_path,
                backup_dir,
            )

        else:

            logger.info(
                f"No existing saves to backup "
                f"at {game_save_path}. "
                f"Creating empty backup marker.",
                extra={
                    "session_id": session_id
                },
            )

            backup_dir.mkdir(
                parents=True, exist_ok=True
            )

        self._set_state(
            session_id,
            SessionState.SAVES_BACKED_UP,
        )

    # ──────────────────────────────────────────
    # Inject User Saves
    # ──────────────────────────────────────────

    def inject_user_saves(
    self,
    session_id: str,
    user_id: str,
    game_config: GameConfig,
    load_save: str | None = None,
    ) -> None:

        game_save_path = Path(
           game_config.save_path
        )

        latest_dir = self._latest_dir(
            user_id,
            game_config.id,
        )

        selected_save_path = latest_dir

        if load_save:

            selected_path = Path(load_save)

            if selected_path.is_absolute():

                raise ValueError(
                    "Absolute save paths "
                    "are not allowed."
                )

            if ".." in selected_path.parts:

                raise ValueError(
                    "Path traversal detected."
                )

            game_root = self._game_save_root(
                user_id,
                game_config.id,
            )

            if load_save.startswith(
                "archives/"
            ):

                custom_path = (
                    game_root / load_save
                )

            elif load_save.startswith(
                "backups/"
            ):

                custom_path = (
                    game_root / load_save
                )

            else:

                raise ValueError(
                    "Invalid save source."
                )

            if not custom_path.exists():

                raise FileNotFoundError(
                    f"Save not found: "
                    f"{custom_path}"
                )

            # ZIP archive support
            if custom_path.suffix == ".zip":

                if not self._verify_restore_archive(custom_path):
                    self.metadata_manager.update_session_field(
                        session_id,
                        "restore_verified",
                        False,
                    )

                    self.metadata_manager.update_session_field(
                        session_id,
                        "restore_source",
                        str(custom_path),
                    )

                    raise RuntimeError(
                        f"Selected archive failed restore verification: {custom_path}"
                    )

                extract_dir = (
                    self._temp_session_dir(
                        session_id
                    )
                    / "selected_save"
                )

                extract_dir.mkdir(
                    parents=True,
                    exist_ok=True,
                )

                with zipfile.ZipFile(
                    custom_path,
                    "r",
                ) as zipf:

                    zipf.extractall(extract_dir)

                selected_save_path = extract_dir

            else:

                restore_ok = self._verify_restore_folder(custom_path)

                logger.info(
                    f"Backup restore verification result: {restore_ok} for {custom_path}",
                    extra={"session_id": session_id},
                )

                if not restore_ok:
                    self.metadata_manager.update_session_field(
                        session_id,
                        "restore_verified",
                        False,
                    )

                    self.metadata_manager.update_session_field(
                        session_id,
                        "restore_source",
                        str(custom_path),
                    )

                    raise RuntimeError(
                        f"Selected backup failed restore verification: {custom_path}"
                    )

                selected_save_path = custom_path

            logger.info(
                f"Using custom save source: "
                f"{selected_save_path}",
                extra={
                    "session_id": session_id
                },
            )
        
        
            self.metadata_manager.update_session_field(
            session_id,
            "restore_verified",
            True,
            )

            self.metadata_manager.update_session_field(
                session_id,
                "restore_source",
                str(selected_save_path),
            )
        
        logger.info(
          f"Preparing isolated save injection: "
          f"{selected_save_path} → {game_save_path}",
          extra={
              "session_id": session_id,
             "user_id": user_id,
          },
        )

        if not load_save:

            if self._folder_has_files(selected_save_path):

                restore_verified = self._verify_restore_folder(
                    selected_save_path
                )

                self.metadata_manager.update_session_field(
                    session_id,
                    "restore_verified",
                    restore_verified,
                )

                self.metadata_manager.update_session_field(
                    session_id,
                    "restore_source",
                    str(selected_save_path),
                )

                if not restore_verified:
                    raise RuntimeError(
                        f"Latest save failed restore verification: {selected_save_path}"
                    )

            else:

                self.metadata_manager.update_session_field(
                    session_id,
                    "restore_verified",
                    None,
                )

                self.metadata_manager.update_session_field(
                    session_id,
                    "restore_source",
                    str(selected_save_path),
                )

        # ALWAYS clear active saves first
        if game_save_path.exists():

            logger.info(
                f"Clearing active game saves: "
                f"{game_save_path}",
                extra={
                    "session_id": session_id,
                },
            )
            for item in game_save_path.iterdir():

                try:

                    if item.is_dir():

                        shutil.rmtree(item)

                    else:

                        item.unlink()

                except Exception as error:

                    logger.error(
                        f"Failed deleting save item: "
                        f"{item} | {error}",
                        extra={
                            "session_id": session_id,
                        },
                    )

                    raise RuntimeError(
                        f"Failed clearing save directory: "
                        f"{item}"
                    ) from error
        else:

            game_save_path.mkdir(
                parents=True,
                exist_ok=True,
            )
        

        # Inject isolated saves if they exist
        if self._folder_has_files(selected_save_path):

            logger.info(
                "Injecting isolated user saves.",
                extra={
                    "session_id": session_id,
                    "user_id": user_id,
                },
            )

            for item in selected_save_path.iterdir():

                if item.name == "manifest.json":
                    continue

                if item.name.endswith(".manifest.json"):
                    continue
                
                src = selected_save_path / item.name
                dst = game_save_path / item.name

                if src.is_dir():

                    shutil.copytree(
                        src,
                        dst,
                        dirs_exist_ok=True,
                    )

                else:

                    shutil.copy2(src, dst)

        else:

            logger.info(
                "No isolated saves found. "
                "Starting fresh profile.",
                extra={
                    "session_id": session_id,
                    "user_id": user_id,
                },
            )

            latest_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

        self._set_state(
            session_id,
            SessionState.SAVES_INJECTED,
        )

        current_hash = (
            self.integrity.calculate_directory_hash(
                game_save_path,
                save_filters=self._get_save_filters(
                    game_config.id
                )
            )
        )

        self.metadata_manager.update_session_field(
            session_id,
            "injected_save_hash",
            current_hash,
        )

        logger.info(
            f"Injected save hash stored: "
            f"{current_hash[:16]}",
            extra={
                "session_id": session_id
            },
        )

    # ──────────────────────────────────────────
    # Capture Saves (after game exit)
    # ──────────────────────────────────────────

    def capture_saves(
        self,
        session_id: str,
        save_changed=True,
    ) -> bool:

        meta = self.metadata_manager.get_session(
            session_id
        )
        
        if meta is None:
            raise ValueError(
                f"Session not found: {session_id}"
            )

        game_save_path = Path(
            meta.game_save_path
        )

        latest_dir = self._latest_dir(
            meta.user_id, meta.game_id
        )

        if not game_save_path.exists():

            logger.warning(
                f"Game save path does not exist "
                f"after exit: {game_save_path}",
                extra={
                    "session_id": session_id
                },
            )

            return False

        logger.info(
            f"Capturing saves: "
            f"{game_save_path} → {latest_dir}",
            extra={"session_id": session_id},
        )

        if not save_changed:

            logger.info(
                "No save changes.",
                extra={"session_id": session_id},
            )

            return False


        temp_latest = latest_dir.with_name(
            latest_dir.name + "_tmp"
        )

        if temp_latest.exists():
            shutil.rmtree(temp_latest)

        temp_latest.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:

            for item in game_save_path.iterdir():

                dst = temp_latest / item.name

                if item.is_dir():

                    shutil.copytree(
                        item,
                        dst,
                        dirs_exist_ok=True,
                    )

                else:

                    shutil.copy2(
                        item,
                        dst,
                    )

        except Exception as error:

            logger.error(
                f"Capture copy failed: {error}",
                extra={
                    "session_id": session_id,
                },
            )

            shutil.rmtree(
                temp_latest,
                ignore_errors=True,
            )

            raise RuntimeError(
                "Failed capturing game saves."
            ) from error


        if latest_dir.exists():

            shutil.rmtree(latest_dir)

        temp_latest.replace(latest_dir)

        self._write_backup_manifest(
            latest_dir,
            meta.user_id,
            meta.game_id,
            "latest",
        )

        latest_verified = self._verify_manifest(
            latest_dir
        )

        self.metadata_manager.update_session_field(
            session_id,
            "latest_manifest_verified",
            latest_verified,
        )

        if not latest_verified:

            if latest_dir.exists():
                shutil.rmtree(latest_dir)
            
            raise RuntimeError(
                "Latest save manifest verification failed. "
                "The latest save may be incomplete or corrupted."
            )

        logger.info(
            f"Latest save manifest verified: {latest_verified}",
            extra={"session_id": session_id},
        )
        
        self._set_state(
            session_id,
            SessionState.SAVES_CAPTURED,
        )

        return True

    # ──────────────────────────────────────────
    # Versioned Backup
    # ──────────────────────────────────────────

    def create_versioned_backup(
        self,
        session_id: str,
    ) -> Path:

        meta = self.metadata_manager.get_session(
            session_id
        )

        if meta is None:
            raise ValueError(
                f"Session not found: {session_id}"
            )

        latest_dir = self._latest_dir(
            meta.user_id, meta.game_id
        )

        backups_dir = self._backups_dir(
            meta.user_id, meta.game_id
        )

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        version_dir = (
            backups_dir / f"v_{timestamp}"
        )

        if not self._folder_has_files(latest_dir):

            logger.warning(
                f"No latest saves to backup "
                f"for session {session_id}",
                extra={
                    "session_id": session_id
                },
            )

            return version_dir

        logger.info(
            f"Creating versioned backup: "
            f"{version_dir}",
            extra={"session_id": session_id},
        )

        shutil.copytree(
            latest_dir,
            version_dir,
        )

        self._write_backup_manifest(
            version_dir,
            meta.user_id,
            meta.game_id,
            "backup",
        )

        backup_verified = self._verify_manifest(
            version_dir
        )        

        self.metadata_manager.update_session_field(
            session_id,
            "backup_manifest_verified",
            backup_verified,
        )

        self.metadata_manager.update_session_field(
            session_id,
            "backup_path",
            str(version_dir),
        )

        if not backup_verified:
            if version_dir.exists():
                shutil.rmtree(version_dir)

            raise RuntimeError(
                f"Backup manifest verification failed for session {session_id}"
            )

        logger.info(
            f"Backup manifest verified: {backup_verified}",
            extra={"session_id": session_id},
        )

        self._set_state(
            session_id,
            SessionState.VERSIONED,
        )

        return version_dir

    # ──────────────────────────────────────────
    # Archive (ZIP)
    # ──────────────────────────────────────────

    def create_archive(
        self,
        session_id: str,
    ) -> Optional[Path]:

        if not self.enable_archives:
            return None

        meta = self.metadata_manager.get_session(
            session_id
        )

        if meta is None:
            raise ValueError(
                f"Session not found: {session_id}"
            )

        latest_dir = self._latest_dir(
            meta.user_id, meta.game_id
        )

        archives_dir = self._archives_dir(
            meta.user_id, meta.game_id
        )

        archives_dir.mkdir(
            parents=True, exist_ok=True
        )

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        archive_name = (
            f"{session_id}_{timestamp}.zip"
        )

        archive_path = archives_dir / archive_name

        if not self._folder_has_files(latest_dir):

            logger.warning(
                f"No latest saves to archive "
                f"for session {session_id}",
                extra={
                    "session_id": session_id
                },
            )

            return None

        logger.info(
            f"Creating archive: {archive_path}",
            extra={"session_id": session_id},
        )

        with zipfile.ZipFile(
            archive_path,
            "w",
            zipfile.ZIP_DEFLATED,
        ) as zipf:

            for file in latest_dir.rglob("*"):

                if file.is_file():

                    if file.name == "manifest.json":
                        continue
                    
                    arcname = file.relative_to(
                        latest_dir
                    )
                    
                    zipf.write(file, arcname)

        self._write_zip_manifest(
            archive_path,
            latest_dir,
            meta.user_id,
            meta.game_id,
        )

        archive_verified = self._verify_zip_archive(
            archive_path
        )

        self.metadata_manager.update_session_field(
            session_id,
            "archive_verified",
            archive_verified,
        )

        if not archive_verified:
            if archive_path.exists():
                archive_path.unlink()

            manifest_path = archive_path.with_suffix(
                archive_path.suffix + ".manifest.json"
            )

            if manifest_path.exists():
                manifest_path.unlink()

            raise RuntimeError(
                f"Archive ZIP verification failed for session {session_id}"
            )
        
        if self.enable_hashing:

            archive_hash = (
                self.integrity.calculate_file_hash(
                    archive_path
                )
            )

            self.metadata_manager.update_session_field(
                session_id,
                "archive_hash",
                archive_hash,
            )

            self.metadata_manager.update_session_field(
                session_id,
                "archive_path",
                str(archive_path),
            )

        self._set_state(
            session_id,
            SessionState.ARCHIVED,
        )

        return archive_path

    def enforce_save_retention(
        self,
        user_id: str,
        game_id: str,
    ) -> None:

        game_root = self._game_save_root(
            user_id,
            game_id,
        )

        backups_dir = (
            game_root / "backups"
        )

        archives_dir = (
            game_root / "archives"
        )

        if backups_dir.exists():

            backups = sorted(
                [
                    item
                    for item in backups_dir.iterdir()
                    if item.is_dir()
                ],
                key=lambda p: p.stat().st_mtime,
            )

            while len(backups) > self.backup_retention:

                oldest = backups.pop(0)
                
                shutil.rmtree(oldest)

                logger.info(
                    f"Deleted old backup: "
                    f"{oldest}"
                )

        if archives_dir.exists():

            archives = sorted(
                [
                    item for item in archives_dir.iterdir()
                    if item.is_file() and item.suffix == ".zip"
                ],
                key=lambda p: p.stat().st_mtime,
            )

            while len(archives) > self.archive_retention:

                oldest = archives.pop(0)

                oldest.unlink()

                sidecar = oldest.with_suffix(
                    oldest.suffix + ".manifest.json"
                )

                if sidecar.exists():
                    sidecar.unlink()
                
                logger.info(
                    f"Deleted old archive: "
                    f"{oldest}"
                )



    # ──────────────────────────────────────────
    # Calculate Integrity Hashes
    # ──────────────────────────────────────────

    def calculate_save_hashes(
        self,
        session_id: str,
    ) -> str:

        meta = self.metadata_manager.get_session(
            session_id
        )

        if meta is None:
            raise ValueError(
                f"Session not found: {session_id}"
            )

        latest_dir = self._latest_dir(
            meta.user_id, meta.game_id
        )

        if not self._folder_has_files(latest_dir):
            return ""

        directory_hash = (
            self.integrity.calculate_directory_hash(
                latest_dir
            )
        )

        self.metadata_manager.update_session_field(
            session_id,
            "latest_save_hash",
            directory_hash,
        )

        logger.info(
            f"Save hash calculated: "
            f"{directory_hash[:16]}...",
            extra={"session_id": session_id},
        )

        return directory_hash

    # ──────────────────────────────────────────
    # Restore Original Saves
    # ──────────────────────────────────────────

    def restore_original_saves(
        self,
        session_id: str,
    ) -> None:

        meta = self.metadata_manager.get_session(
            session_id
        )

        if meta is None:
            raise ValueError(
                f"Session not found: {session_id}"
            )

        game_save_path = Path(
            meta.game_save_path
        )

        original_backup = (
            self._original_backup_dir(session_id)
        )

        if not original_backup.exists():

            logger.warning(
                f"No original backup found for "
                f"session {session_id}",
                extra={
                    "session_id": session_id
                },
            )

            return

        logger.info(
            f"Restoring original saves: "
            f"{original_backup} → "
            f"{game_save_path}",
            extra={"session_id": session_id},
        )

        # Check if original backup has any files
        has_files = any(
            original_backup.rglob("*")
        )

        if has_files:

            # Create parent directory if needed
            game_save_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            # Copy all files from backup
            restore_temp = (
                game_save_path.parent
                / f"{game_save_path.name}_restore"
            )

            if restore_temp.exists():
                shutil.rmtree(restore_temp)

            restore_temp.mkdir(
                parents=True,
                exist_ok=True,
            )
            
            for item in original_backup.iterdir():

                src = item
                dst = restore_temp / item.name

                if src.is_dir():

                    shutil.copytree(
                        src,
                        dst,
                        dirs_exist_ok=True,
                    )

                else:

                    shutil.copy2(src, dst)
            
            if game_save_path.exists():

                try:

                    shutil.rmtree(
                        game_save_path
                    )

                except Exception as error:

                    logger.error(
                        f"Failed to remove game save directory: "
                        f"{error}",
                        extra={
                            "session_id": session_id
                        },
                    )

                    raise

            try:

                restore_temp.rename(game_save_path)

            except Exception as error:

                logger.error(
                    f"Restore rename failed: {error}"
                )

                logger.error(
                    f"Recovered saves remain at: {restore_temp}"
                )

                raise

        
        
        else:

            logger.info(
                "Original backup was empty. "
                "Game save directory removed.",
                extra={
                    "session_id": session_id
                },
            )

        self._set_state(
            session_id,
            SessionState.RESTORED,
        )

    # ──────────────────────────────────────────
    # Full Cleanup Session
    # ──────────────────────────────────────────

    def cleanup_session(
        self,
        session_id: str,
    ) -> None:
        """
        Full post-game cleanup sequence:
          1. Wait for save stabilization
          2. Capture updated saves
          3. Create versioned backup
          4. Calculate integrity hashes
          5. Create ZIP archive
          6. Restore original saves
          7. Clean temp directory
          8. Release session lock
          9. Mark session complete
        """

        meta = self.metadata_manager.get_session(
            session_id
        )

        if meta is None:

            logger.error(
                f"Cannot cleanup unknown "
                f"session: {session_id}"
            )

            return

        game_save_path = Path(
            meta.game_save_path
        )

        try:

            # 1. Wait for save stabilization
            if game_save_path.exists():

                self.stability.wait_until_save_files_stable(
                    save_dir=game_save_path,
                    stable_duration=10,
                    polling_interval=2,
                    session_id=session_id
                )

                self._set_state(
                    session_id,
                    SessionState.SAVES_STABILIZED,
                )

            # 2. Calculate post-session hash
            current_hash = (
                self.integrity.calculate_directory_hash(
                    game_save_path,
                    save_filters=self._get_save_filters(
                        meta.game_id
                    ),
                )
            )

            injected_hash = getattr(
                meta,
                "injected_save_hash",
                None,
            )

            save_changed = (
                injected_hash != current_hash
            )

            # 3. Capture saves ONLY if gameplay changed
            if save_changed:

                self.capture_saves(
                    session_id,
                    save_changed=True,
                )

            else:

                logger.info(
                    "Save unchanged. "
                    "Skipping latest save update.",
                    extra={
                        "session_id": session_id
                    },
                )

            # 4. Create backup/archive ONLY if changed
            if save_changed:

                logger.info(
                    "Save changed. "
                    "Creating backup and archive.",
                    extra={
                        "session_id": session_id
                    },
                )

                self.backup_error = None

                try:

                    backup_path = self.create_versioned_backup(
                        session_id
                    )

                    logger.info(
                        f"Verified backup created: {backup_path}",
                        extra={
                            "session_id": session_id
                        },
                    )

                except Exception as error:

                    self.backup_error = error

                    logger.error(
                        f"Backup creation failed: {error}",
                        extra={
                            "session_id": session_id
                        },
                    )

                    self.metadata_manager.update_session_field(
                        session_id,
                        "backup_manifest_verified",
                        False,
                    )
                
                if self.backup_error:
                    
                    logger.warning(
                        "Backup failed. Checking for live Sync Status...",
                        extra={
                            "session_id": session_id
                        },
                    )
                    
                    meta = self.metadata_manager.get_session(
                        session_id
                    )
                    
                    live_hash = getattr(
                        meta,
                        "live_sync_hash",
                        None,
                    )

                    latest_safe = (
                        getattr(meta, "live_sync_preserved", False)
                        and live_hash == current_hash
                    )

                    if latest_safe:

                        self.metadata_manager.update_session_field(
                            session_id,
                            "live_sync_fallback",
                            True,
                        )
                        
                        self.metadata_manager.update_session_field(
                            session_id,
                            "backup_failed",
                            True,
                        )

                        logger.warning(
                            "Session completed using Live Sync fallback.",
                            extra={
                                "session_id": session_id
                            },
                        )

                    else:

                        logger.warning(
                            f"Backup failed {self.backup_error}",
                            extra={
                                "session_id": session_id
                            },
                        )
                        
                        raise self.backup_error

                self.archive_error = None

                if self.enable_archives:

                    try:

                        archive_path = self.create_archive(
                            session_id
                        )

                        logger.info(
                            f"Verified archive created: {archive_path}",
                            extra={
                                "session_id": session_id
                            },
                        )

                    except Exception as error:

                        self.archive_error = error

                        logger.error(
                            f"Archive creation failed: {error}",
                            extra={
                                "session_id": session_id
                            },
                        )

                        self.metadata_manager.update_session_field(
                            session_id,
                            "archive_verified",
                            False,
                        )

                        self.metadata_manager.update_session_field(
                            session_id,
                            "archive_failed",
                            True,
                        )

                self.enforce_save_retention(
                    meta.user_id,
                    meta.game_id,
                )

            else:

                logger.info(
                    "Save unchanged. "
                    "Skipping backup/archive creation.",
                    extra={
                        "session_id": session_id
                    },
                )

            # 6. Restore original saves
            self.restore_original_saves(
                session_id
            )

            # 7. Clean temp directory
            temp_dir = self._temp_session_dir(
                session_id
            )

            if temp_dir.exists():

                shutil.rmtree(temp_dir)

                logger.info(
                    f"Temp directory cleaned: "
                    f"{temp_dir}",
                    extra={
                        "session_id": session_id
                    },
                )

            # 8. Release session lock
            self.release_session_lock(session_id)

            # 9. Mark session complete
            self.metadata_manager.update_session_field(
                session_id,
                "ended_at",
                int(time.time()),
            )

            self.metadata_manager.update_session_field(
                session_id,
                "crash_recovery_required",
                False,
            )

            self.metadata_manager.update_session_field(
                session_id,
                "integrity_verified",
                True,
            )

            self._set_state(
                session_id,
                SessionState.CLEANED_UP,
            )

            if self.archive_error:
                
                logger.warning(
                    "Session completed but archive creation failed.",
                    extra={
                        "session_id": session_id
                    },
                )
            
            logger.info(
                f"Session cleanup complete: "
                f"{session_id}",
                extra={
                    "session_id": session_id,
                    "user_id": meta.user_id,
                    "game_id": meta.game_id,
                },
            )

            if self.backup_error and self.archive_error:
                result = "backup_archive_failed"

            elif self.backup_error:                
                result = "backup_failed"

            elif self.archive_error:               
                result = "archive_failed"

            else:                
                result = "success"
            
            self.metadata_manager.update_session_field(
                session_id,
                "cleanup_result",
                result,
            )

        except Exception as error:

            logger.error(
                f"Cleanup failed for session "
                f"{session_id}: {error}",
                extra={
                    "session_id": session_id
                },
            )

            try:

                self.release_session_lock(
                    session_id
                )

            except Exception:

                logger.error(
                    "Failed to release lock during cleanup failure.",
                    extra={
                        "session_id": session_id
                    },
                )
            
            self.metadata_manager.update_session_field(
                session_id,
                "integrity_verified",
                False,
            )
            
            self._set_state(
                session_id,
                SessionState.FAILED,
            )

            raise

        finally:
            self.backup_error = None
            self.archive_error = None

    # ──────────────────────────────────────────
    # Health Check
    # ──────────────────────────────────────────

    def health_check(self) -> HealthStatus:

        issues = []

        metadata_valid = True
        lock_valid = True
        paths_valid = True
        write_permissions = True

        # Check metadata file
        try:
            self.metadata_manager.read_metadata()

        except Exception as error:
            metadata_valid = False
            issues.append(
                f"Metadata error: {error}"
            )

        # Check lock file consistency
        if self.lock_manager.is_locked():

            lock = self.lock_manager.read_lock()

            if lock is None:
                lock_valid = False
                issues.append(
                    "Lock file exists but "
                    "is corrupt"
                )

        # Check save paths
        if not self.saves_root.exists():
            paths_valid = False
            issues.append(
                f"Saves root missing: "
                f"{self.saves_root}"
            )

        if not self.temp_root.exists():
            paths_valid = False
            issues.append(
                f"Temp root missing: "
                f"{self.temp_root}"
            )

        # Check write permissions
        try:

            test_file = (
                self.saves_root / ".write_test"
            )

            test_file.write_text("test")
            test_file.unlink()

        except Exception:
            write_permissions = False
            issues.append(
                "Cannot write to saves_root"
            )

        healthy = (
            metadata_valid
            and lock_valid
            and paths_valid
            and write_permissions
        )

        return HealthStatus(
            healthy=healthy,
            metadata_valid=metadata_valid,
            lock_valid=lock_valid,
            paths_valid=paths_valid,
            write_permissions=write_permissions,
            issues=issues,
        )

    # ──────────────────────────────────────────
    # Crash Recovery
    # ──────────────────────────────────────────

    def recover_stale_session(self) -> None:

        if not self.lock_manager.is_locked():
            return

        lock = self.lock_manager.read_lock()

        if lock is None:

            logger.warning(
                "Corrupt lock found. "
                "Force releasing."
            )

            self.lock_manager.force_release()
            return

        logger.warning(
            f"Stale session detected: "
            f"{lock.session_id}. "
            f"Attempting recovery."
        )

        try:

            meta = self.metadata_manager.get_session(
                lock.session_id
            )

        except Exception as error:

            logger.error(
                f"Recovery metadata read failed: {error}"
            )

            meta = None

        restore_success = False

        if meta is not None:

            try:

                self.restore_original_saves(
                    lock.session_id
                )

                restore_success = True

            except Exception as error:

                logger.error(
                    f"Recovery restore failed: "
                    f"{error}"
                )

        temp_dir = self._temp_session_dir(
            lock.session_id
        )

        if restore_success:
        
            if temp_dir.exists():
                shutil.rmtree(temp_dir)

        logger.info(
            f"Recovered session temp directory removed: "
            f"{temp_dir}"
        )

        self.lock_manager.force_release()

        if meta is not None:

            self._set_state(
                lock.session_id,
                SessionState.FAILED,
            )

            self.metadata_manager.update_session_field(
                lock.session_id,
                "crash_recovery_required",
                False,
            )

            self.metadata_manager.update_session_field(
                lock.session_id,
                "integrity_verified",
                False,
            )

            self.metadata_manager.update_session_field(
                lock.session_id,
                "cleanup_result",
                "crash_recovered",
            )

        logger.info(
            "Stale session recovery complete."
        )

    # ──────────────────────────────────────────
    # Internal Helpers
    # ──────────────────────────────────────────

    def _set_state(
        self,
        session_id: str,
        state: SessionState,
    ) -> None:

        self.metadata_manager.update_session_state(
            session_id=session_id,
            state=state,
        )

    def list_user_saves(
        self,
        user_id: str,
        game_id: str,
    ) -> dict:
        """
        List available saves for a user/game.

        Returns only names:
        - latest_exists: whether latest save folder exists and has files
        - archives: archive zip file names only
        - backups: backup folder names only

        Does NOT expose archive contents or backup contents.
        """

        if game_id not in self.game_configs:
            raise ValueError(
                f"Unknown game_id: {game_id}"
            )

        user_root = self._user_save_dir(
            user_id,
            game_id,
        )

        latest_dir = user_root / "latest"
        archives_dir = user_root / "archives"
        backups_dir = user_root / "backups"

        latest_exists = (
            latest_dir.exists()
            and latest_dir.is_dir()
            and any(latest_dir.iterdir())
        )

        archives = []

        if archives_dir.exists():

            archives = [
                item
                for item in archives_dir.iterdir()
                if item.is_file()
                and item.suffix.lower() == ".zip"
            ]

            archives.sort(
                key=lambda item: item.stat().st_mtime,
                reverse=True,
            )

            archives = [
                item.name
                for item in archives
            ]

        backups = []

        if backups_dir.exists():
            backups = sorted(
                item.name
                for item in backups_dir.iterdir()
                if item.is_dir()
            )

        return {
            "user_id": user_id,
            "game_id": game_id,
            "latest_exists": latest_exists,
            "archives": archives,
            "backups": backups,
        }

    def delete_user_save(
        self,
        user_id: str,
        game_id: str,
        save_type: str,
        save_name: str,
    ) -> dict:
        """
        Delete one archive zip or one backup folder.

        Safety rules:
        - save_type must be archives or backups
        - save_name must be a plain name only
        - no path traversal
        - latest cannot be deleted here
        """

        if game_id not in self.game_configs:
            raise ValueError(
                f"Unknown game_id: {game_id}"
            )

        if save_type not in {
            "archives",
            "backups",
        }:
            raise ValueError(
                "save_type must be archives or backups"
            )

        if (
            not save_name
            or "/" in save_name
            or "\\" in save_name
            or ".." in save_name
        ):
            raise ValueError(
                "Invalid save name"
            )

        user_root = self._user_save_dir(
            user_id,
            game_id,
        )

        target_root = user_root / save_type
        target = target_root / save_name

        # Resolve paths to prevent escaping user_root
        target_root_resolved = target_root.resolve()
        target_resolved = target.resolve()

        if target_root_resolved not in target_resolved.parents:
            raise ValueError(
                "Invalid save path"
            )

        if save_type == "archives":

            if target.suffix.lower() != ".zip":
                raise ValueError(
                    "Archive must be a .zip file"
                )

            if not target.exists() or not target.is_file():
                raise FileNotFoundError(
                    f"Archive not found: {save_name}"
                )

            target.unlink()

            logger.info(
                f"Deleted archive: {target}"
            )
            
            manifest_path = target.with_suffix(
                target.suffix + ".manifest.json"
            )

            if manifest_path.exists():

                manifest_path.unlink()

                logger.info(
                    f"Deleted archive manifest: "
                    f"{manifest_path}"
                )

        else:
            if not target.exists() or not target.is_dir():
                raise FileNotFoundError(
                    f"Backup not found: {save_name}"
                )

            shutil.rmtree(target)

            logger.info(
                f"Deleted Backup: {target}"
            )

        return {
            "success": True,
            "deleted": save_name,
            "type": save_type,
        }


    def validate_load_save_exists(
        self,
        user_id: str,
        game_id: str,
        load_save: str | None,
    ) -> None:

        if load_save is None:
            return

        save_root = self._user_save_dir(
            user_id,
            game_id,
        )

        save_path = (
            save_root
            / load_save
        ).resolve()

        if save_root.resolve() not in save_path.parents:
            raise ValueError(
                "Path traversal detected."
            )

        if not save_path.exists():
            raise FileNotFoundError(
                f"Selected save does not exist: {load_save}"
            )

    def _hash_file(
        self,
        path: Path,
    ) -> str:
        hasher = hashlib.sha256()

        with path.open("rb") as file:
            for chunk in iter(lambda: file.read(1024 * 1024), b""):
                hasher.update(chunk)

        return hasher.hexdigest()

    def _hash_folder(
        self,
        folder: Path,
    ):
        hashes = {}

        for path in sorted(folder.rglob("*")):
            if path.is_file():

                if path.name == "manifest.json":
                    continue

                if path.name.endswith(".manifest.json"):
                    continue
                relative_path = str(
                    path.relative_to(folder)
                )

                hashes[relative_path] = self._hash_file(path)

        return hashes

    def _write_backup_manifest(
        self,
        backup_path: Path,
        user_id: str,
        game_id: str,
        save_type: str,
    ):
        manifest = {
            "user_id": user_id,
            "game_id": game_id,
            "save_type": save_type,
            "created_at": time.time(),
            "files": self._hash_folder(backup_path),
        }

        manifest_path = backup_path / "manifest.json"

        temp_path = manifest_path.with_suffix(
            ".tmp"
        )

        with temp_path.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                manifest,
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp_path.replace(
            manifest_path
        )

    def _write_zip_manifest(
        self,
        zip_path: Path,
        source_folder: Path,
        user_id: str,
        game_id: str,
    ):
        manifest = {
            "user_id": user_id,
            "game_id": game_id,
            "save_type": "archive_zip",
            "created_at": time.time(),
            "zip_file": zip_path.name,
            "source_files": self._hash_folder(source_folder),
            "zip_sha256": self._hash_file(zip_path),
            "zip_size_bytes": zip_path.stat().st_size,
        }

        manifest_path = zip_path.with_suffix(
            zip_path.suffix + ".manifest.json"
        )

        temp_path = manifest_path.with_suffix(
            ".tmp"
        )

        with temp_path.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                manifest,
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()

            os.fsync(
                file.fileno()
            )

        temp_path.replace(
            manifest_path
        )

    def _verify_zip_archive(
        self,
        zip_path: Path,
    ) -> bool:
        try:
            with zipfile.ZipFile(zip_path, "r") as zipf:
                bad_file = zipf.testzip()

            if bad_file is not None:
                logger.error(
                    f"Archive verification failed. Bad file: {bad_file}"
                )
                return False

            return True

        except Exception as error:
            logger.error(
                f"Archive verification failed for {zip_path}: {error}"
            )
            return False

    def _folder_has_files(
        self,
        folder: Path,
    ) -> bool:
        return (
            folder.exists()
            and folder.is_dir()
            and any(
                path.is_file()
                for path in folder.rglob("*")
            )
        )

    def _verify_manifest(
        self,
        folder: Path,
    ) -> bool:
        manifest_path = folder / "manifest.json"

        if not manifest_path.exists():
            logger.warning(f"Manifest missing: {manifest_path}")
            return False

        try:
            with manifest_path.open("r", encoding="utf-8") as file:
                manifest = json.load(file)

            expected_files = dict(manifest.get("files", {}))
            actual_files = self._hash_folder(folder)

            expected_files.pop("manifest.json", None)
            actual_files.pop("manifest.json", None)

            if expected_files != actual_files:
                logger.error(
                    f"Manifest mismatch for {folder}. "
                    f"Expected={len(expected_files)} files, "
                    f"Actual={len(actual_files)} files"
                )

                for name, expected_hash in expected_files.items():
                    actual_hash = actual_files.get(name)

                    if actual_hash != expected_hash:
                        logger.error(
                            f"Hash mismatch: {name} "
                            f"expected={expected_hash} actual={actual_hash}"
                        )
                        break

                return False

            logger.info(f"Manifest verified successfully: {folder}")
            return True

        except Exception as error:
            logger.error(
                f"Manifest verification failed for {folder}: {error}"
            )
            return False

    def _verify_restore_folder(
        self,
        folder: Path,
    ) -> bool:
        if not self._folder_has_files(folder):
            return False

        manifest_path = folder / "manifest.json"

        if not manifest_path.exists():

            raise RuntimeError(
                "[ERROR] Latest save integrity verification failed.\n"
                "manifest.json is missing.\n\n"
                "The latest save appears to be corrupted.\n"
                "Please restore from a backup or archive,\n"
                "or repair the manifest."
            )

        return self._verify_manifest(folder)

    def _verify_restore_archive(
        self,
        zip_path: Path,
    ) -> bool:

        if not zip_path.exists():
            return False

        if not self._verify_zip_archive(zip_path):
            return False

        manifest_path = zip_path.with_suffix(
            zip_path.suffix + ".manifest.json"
        )

        if not manifest_path.exists():
            logger.error(
                f"Restore archive sidecar manifest missing: {manifest_path}"
            )
            return False

        try:
            with manifest_path.open("r", encoding="utf-8") as file:
                manifest = json.load(file)

            expected_hash = manifest.get("zip_sha256")
            actual_hash = self._hash_file(zip_path)

            if expected_hash != actual_hash:
                logger.error(
                    f"Archive hash mismatch: {zip_path}"
                )
                return False

            return True

        except Exception as error:
            logger.error(
                f"Restore archive manifest check failed: {error}"
            )
            return False

    def _get_save_filters(
        self,
        game_id: str,
    ) -> SaveFilters:

        return (
            self.get_game_config(
                game_id
            ).save_filters
        )