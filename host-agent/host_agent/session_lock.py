from __future__ import annotations

import json
import os
import time
import psutil
from pathlib import Path
from typing import Optional

from host_agent.logging_config import configure_logger
from host_agent.models import SessionLock

logger = configure_logger()


class SessionLockManager:

    def __init__(
        self,
        lock_file_path: Path,
    ) -> None:

        self.lock_file_path = Path(lock_file_path)

        self.lock_file_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

    def release_stale_finished_lock(self) -> bool:
        if not self.is_locked():
            return False

        existing = self.read_lock()

        try:
            from api.services.session_service import active_sessions, registry_lock

            with registry_lock:
                session = active_sessions.get(existing.session_id)

                if session and session.get("status") in (
                    "completed",
                    "failed",
                    "stopped",
                ):
                    self.release(existing.session_id)
                    return True

                if session is None:
                    self.release(existing.session_id)
                    return True

        except Exception:
            return False

        return False
    
    def release_stale_lock(self) -> bool:
        if not self.is_locked():
            return False

        existing = self.read_lock()

        if existing is None:

            logger.warning(
                "Corrupt lock file detected. Removing."
            )

            self.force_release()

            return True
        
        # If lock process is dead, lock is stale.
        if existing.pid and not psutil.pid_exists(existing.pid):
            logger.warning(
                f"Releasing stale session lock from dead pid: {existing.pid}"
            )
            self.release(existing.session_id)
            return True

        return False
    
    def acquire(
        self,
        session_id: str,
        user_id: str,
        game_id: str,
    ) -> SessionLock:

        if self.is_locked():
            self.release_stale_finished_lock()

        if self.is_locked():
            self.release_stale_lock()

        if self.is_locked():
            existing = self.read_lock()

            raise RuntimeError(
                f"Another session is already locked by "
                f"session_id={existing.session_id}, "
                f"user_id={existing.user_id}, "
                f"game_id={existing.game_id}"
            )

        lock = SessionLock(
            session_id=session_id,
            user_id=user_id,
            game_id=game_id,
            locked_at=int(time.time()),
            pid=os.getpid(),
        )

        self._write_lock_atomic(lock)

        logger.info(
            f"Session lock acquired: {session_id}",
            extra={
                "session_id": session_id,
                "user_id": user_id,
                "game_id": game_id,
            },
        )

        return lock

    def release(
        self,
        session_id: str,
    ) -> None:

        if not self.is_locked():

            logger.warning(
                "Attempted to release lock "
                "but no lock exists."
            )

            return

        existing = self.read_lock()

        if existing and existing.session_id != session_id:

            raise RuntimeError(
                f"Lock session_id mismatch: "
                f"expected={session_id}, "
                f"found={existing.session_id}"
            )

        self.lock_file_path.unlink(missing_ok=True)

        logger.info(
            f"Session lock released: {session_id}",
            extra={"session_id": session_id},
        )

    def release_any(self):
        if self.lock_file_path.exists():
            self.lock_file_path.unlink()

            logger.warning(
                "Session lock file forcefully deleted."
            )
    
    def force_release(self) -> None:

        if self.is_locked():

            existing = self.read_lock()

            logger.warning(
                f"Force releasing lock: "
                f"{existing.session_id if existing else 'unknown'}"
            )

        self.lock_file_path.unlink(missing_ok=True)

        logger.warning("Session lock force released.")

    def is_locked(self) -> bool:
        return self.lock_file_path.exists()

    def read_lock(self) -> Optional[SessionLock]:

        if not self.is_locked():
            return None

        try:

            with open(
                self.lock_file_path,
                "r",
                encoding="utf-8",
            ) as file:

                data = json.load(file)

            return SessionLock(
                session_id=data["session_id"],
                user_id=data["user_id"],
                game_id=data["game_id"],
                locked_at=data["locked_at"],
                pid=data["pid"],
            )

        except (
            json.JSONDecodeError,
            KeyError,
        ) as error:

            logger.error(
                f"Corrupt lock file: {error}"
            )

            return None

    def _write_lock_atomic(
        self,
        lock: SessionLock,
    ) -> None:

        temp_path = (
            self.lock_file_path.parent
            / "session.lock.tmp"
        )

        lock_data = {
            "session_id": lock.session_id,
            "user_id": lock.user_id,
            "game_id": lock.game_id,
            "locked_at": lock.locked_at,
            "pid": lock.pid,
        }

        with open(
            temp_path,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                lock_data,
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()
            os.fsync(file.fileno())

        temp_path.replace(self.lock_file_path)
