from __future__ import annotations
import threading
from game_launcher import GameLauncher
from host_agent.logging_config import configure_logger
from host_agent.save_manager import SaveManager

logger = configure_logger()


class CleanupManager:

    def __init__(
        self,
        save_manager: SaveManager,
        game_launcher: GameLauncher,
    ) -> None:

        self.save_manager = save_manager
        self.game_launcher = game_launcher

        self.cleanup_in_progress = set()
        self.completed_sessions = set()

        self.cleanup_lock = threading.Lock()

    def safe_cleanup(
        self,
        session_id: str,
        process_name: str,
    ) -> None:

        with self.cleanup_lock:

            if session_id in self.completed_sessions:

                logger.warning(
                    f"Cleanup already completed: "
                    f"{session_id}"
                )

                return

            if session_id in self.cleanup_in_progress:

                logger.warning(
                    f"Cleanup already in progress: "
                    f"{session_id}"
                )

                return

            self.cleanup_in_progress.add(
                session_id
            )

        
        
        logger.info(
            "Starting safe cleanup.",
            extra={"session_id": session_id},
        )

        try:

            if self.game_launcher.is_process_running(
                process_name
            ):

                self.game_launcher.terminate_process_by_name(
                    process_name,
                    session_id=session_id,
                )

                self.game_launcher.wait_for_process_exit(
                    process_name,
                    polling_interval=2,
                    session_id=session_id,
                )

            self.save_manager.live_sync.stop()
            
            self.save_manager.cleanup_session(
                session_id
            )

            with self.cleanup_lock:

                self.cleanup_in_progress.discard(
                    session_id
                )

                self.completed_sessions.add(
                    session_id
                )

            logger.info(
                "Safe cleanup completed.",
                extra={
                    "session_id": session_id
                },
            )

        except Exception as error:

            with self.cleanup_lock:

                self.cleanup_in_progress.discard(
                    session_id
                )
            
            logger.error(
                f"Safe cleanup failed: {error}",
                extra={
                    "session_id": session_id
                },
            )

            raise

        finally:

            pass

    def force_cleanup(
        self,
        session_id: str,
        process_name: str,
    ) -> None:

        with self.cleanup_lock:

            if session_id in self.completed_sessions:

                logger.warning(
                    f"Cleanup already completed: "
                    f"{session_id}"
                )

                return

            if session_id in self.cleanup_in_progress:

                logger.warning(
                    f"Cleanup already in progress: "
                    f"{session_id}"
                )

                return

            self.cleanup_in_progress.add(
                session_id
            )
        
        
        
        logger.warning(
            "Starting force cleanup.",
            extra={"session_id": session_id},
        )

        try:

            if self.game_launcher.is_process_running(
                process_name
            ):

                self.game_launcher.force_kill_process(
                    process_name,
                    session_id=session_id,
                )

            self.save_manager.live_sync.stop()
            
            self.save_manager.cleanup_session(
                session_id
            )

            with self.cleanup_lock:

                self.cleanup_in_progress.discard(
                    session_id
                )

                self.completed_sessions.add(
                    session_id
                )

            logger.warning(
                "Force cleanup completed.",
                extra={
                    "session_id": session_id
                },
            )

        except Exception as error:

            with self.cleanup_lock:

                self.cleanup_in_progress.discard(
                    session_id
                )
            
            logger.error(
                f"Force cleanup failed: {error}",
                extra={
                    "session_id": session_id
                },
            )

            raise

        finally:

            pass

    def recover_failed_session(
        self,
        session_id: str,
    ) -> None:

        logger.warning(
            f"Recovering failed session: "
            f"{session_id}",
            extra={"session_id": session_id},
        )

        try:

            self.save_manager.restore_original_saves(
                session_id
            )

            self.save_manager.release_session_lock(
                session_id
            )

            logger.info(
                "Session recovery successful.",
                extra={
                    "session_id": session_id
                },
            )

        except Exception as error:

            logger.error(
                f"Session recovery failed: "
                f"{error}",
                extra={
                    "session_id": session_id
                },
            )

            raise

    def is_cleanup_completed(
        self,
        session_id: str,
    ) -> bool:

        return session_id in self.completed_sessions