from __future__ import annotations

import threading
import time
from pathlib import Path

from host_agent.logging_config import configure_logger

logger = configure_logger()


class LiveSyncManager:

    def __init__(
        self,
        save_manager,
        interval: int = 15,
        settle_time: int = 15,
    ) -> None:

        self.save_manager = save_manager
        self.interval = interval
        self.settle_time = settle_time

        self.thread = None
        self.running = False
        self.started_at = None

        self.session_id = None
        self.last_hash = None
        self.injected_save_hash = None
        self.pending_hash = None
        self.pending_since = None
        self.first_change_time = None
        self.stop_event = threading.Event()

    def start(
        self,
        session_id: str,
    ) -> None:
        
        if self.running:
            return

        self.stop_event.clear()
        
        self.session_id = session_id
        self.started_at = time.time()

        meta = self.save_manager.metadata_manager.get_session(
            session_id
        )

        if meta:

            self.last_hash = meta.injected_save_hash

            self.injected_save_hash = (
                meta.injected_save_hash
            )

        self.running = True

        self.thread = threading.Thread(
            target=self._sync_loop,
            daemon=True,
        )

        self.thread.start()

        logger.info(
            f"Live sync started: {session_id}",
            extra={"session_id": session_id},
        )

    def stop(self) -> None:

        if self.thread and self.thread.is_alive():
            self.stop_event.set()
            self.thread.join()
            if self.thread.is_alive():

                logger.warning(
                    "Live sync thread did not stop in time.",
                    extra={
                        "session_id": self.session_id,
                    },
                )

        self.running = False
        
        logger.info(
            "Live sync stopped.",
            extra={"session_id": self.session_id},
        )
        self.thread = None
        self.last_hash = None
        self.pending_hash = None
        self.pending_since = None
        self.first_change_time = None
        self.session_id = None
        self.started_at = None
        self.injected_save_hash = None

    def _sync_loop(self) -> None:
        
        while not self.stop_event.is_set():
            
            session_runtime = (
                time.time() - self.started_at
            )

            # Ignore startup save mutations
            if session_runtime < 60:

                self.stop_event.wait(self.interval)
                continue
            
            try:

                self._perform_sync()

            except Exception as error:

                logger.error(
                    f"Live sync failed: {error}",
                    extra={
                        "session_id": self.session_id,
                    },
                )
            self.stop_event.wait(self.interval)

    def _perform_sync(self) -> None:
        
        meta = self.save_manager.metadata_manager.get_session(
            self.session_id
        )

        if meta is None:
            return

        game_save_path = Path(meta.game_save_path)

        if not game_save_path.exists():

            self.pending_hash = None
            self.pending_since = None
            self.first_change_time = None

            return

        current_hash = (
            self.save_manager.integrity
            .calculate_directory_hash(
                game_save_path,
                save_filters=
                self.save_manager._get_save_filters(
                    meta.game_id
                ),
            )
        )

        # First loop:
        # store runtime hash only
        if self.last_hash is None:

            self.last_hash = current_hash
            return

        # IMPORTANT:
        # compare against injected save baseline
        if (
            current_hash
            == self.injected_save_hash
        ):

            self.last_hash = current_hash

            self.pending_hash = None
            self.pending_since = None
            self.first_change_time = None

            return

        # Ignore unchanged live state
        if current_hash == self.last_hash:
            return

        if current_hash != self.pending_hash:

            if self.pending_hash is None:

                self.first_change_time = time.time()
            
            self.pending_hash = current_hash
            self.pending_since = time.time()

            logger.info(
                "Live sync change detected.",
                extra={
                    "session_id": self.session_id
                },
            )

            self.save_manager.metadata_manager.update_session_field(
                self.session_id,
                "live_sync_triggered",
                True,
            )

            return

        if (
            self.pending_since is not None
            and time.time() - self.pending_since < self.settle_time
        ):
            return
        
        latest_dir = (
            self.save_manager._latest_dir(
                meta.user_id,
                meta.game_id,
            )
        )

        try:

            self.save_manager.replace_latest_saves(
                game_save_path,
                latest_dir,
            )

        except Exception as error:

            logger.error(
                f"Live sync copy failed: {error}",
                extra={
                    "session_id": self.session_id
                },
            )

            return

        if self.first_change_time is not None:

            logger.info(
                f"Live sync stabilized after "
                f"{int(time.time() - self.first_change_time)}s "
                f"from first detected change.",
                extra={
                    "session_id": self.session_id
                },
            )

        self.last_hash = current_hash

        self.pending_hash = None
        self.pending_since = None
        self.injected_save_hash = current_hash
        self.first_change_time = None
        
        logger.info(
            "Live latest sync completed.",
            extra={
                "session_id": self.session_id
            },
        )

        self.save_manager.metadata_manager.update_session_field(
            self.session_id,
            "live_sync_preserved",
            True,
        )

        self.save_manager.metadata_manager.update_session_field(
            self.session_id,
            "live_sync_hash",
            current_hash,
        )

        meta = self.save_manager.metadata_manager.get_session(
            self.session_id
        )

        if meta is None:
            return
        
        count = getattr(
            meta,
            "live_sync_count",
            0,
        )

        self.save_manager.metadata_manager.update_session_field(
            self.session_id,
            "live_sync_count",
            count + 1,
        )

        self.save_manager.metadata_manager.update_session_field(
            self.session_id,
            "live_sync_last_time",
            int(time.time()),
        )