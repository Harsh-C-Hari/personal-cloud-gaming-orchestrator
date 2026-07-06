import threading
import time
import os
import shutil
import asyncio
import json
from pathlib import Path
from api.session_registry import (
    active_sessions,
    registry_lock,
)

from api.dependencies import (
    save_manager,
    game_launcher,
    cleanup_manager,
    lifecycle_manager,
)
from host_agent.logging_config import (
    configure_logger,
)
from host_agent.session_stats_manager import (
    session_stats_manager,
)
from host_agent.models import SessionState
from api.websocket_manager import (
    websocket_manager,
)

logger = configure_logger()


class SessionService:

    def __init__(self):
        self.session_start_lock = threading.Lock()
    
    def _resolve_load_save(
        self,
        request,
    ):

        if (
            not request.load_save_type
            or request.load_save_type == "latest"
        ):
            return None

        if request.load_save_type not in {
            "archives",
            "backups",
        }:
            raise ValueError(
                "Invalid save type selected."
            )

        if not request.load_save_name:
            raise ValueError(
                "Please select an archive or backup save before launching."
            )

        if (
            "/" in request.load_save_name
            or "\\" in request.load_save_name
            or ".." in request.load_save_name
        ):
            raise ValueError(
                "Invalid save name selected."
            )

        load_save = (
            f"{request.load_save_type}/"
            f"{request.load_save_name}"
        )

        return load_save

    def _safe_read_json(
        self,
        path: Path,
        default,
    ):

        if not path.exists():
            return default

        last_error = None

        for _ in range(5):

            try:

                with path.open(
                    "r",
                    encoding="utf-8",
                ) as file:

                    return json.load(file)

            except PermissionError as error:

                last_error = error
                time.sleep(0.2)

            except json.JSONDecodeError as error:

                logger.error(
                    f"Corrupted JSON file {path}: {error}"
                )

                backup_path = path.with_suffix(
                    path.suffix + ".corrupt"
                )

                try:

                    shutil.copy2(
                        path,
                        backup_path,
                    )

                except Exception:
                    pass

                return default

            except Exception as error:

                logger.error(
                    f"Failed to read JSON file {path}: {error}"
                )

                return default

        logger.error(
            f"Failed to read JSON file {path} after retries: {last_error}"
        )

        return default


    def _safe_write_json(
        self,
        path: Path,
        data,
    ) -> None:

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temp_path = path.with_suffix(
            path.suffix + ".tmp"
        )

        last_error = None

        for _ in range(5):

            try:
                with temp_path.open(
                    "w",
                    encoding="utf-8",
                ) as file:
                    json.dump(
                        data,
                        file,
                        indent=2,
                        ensure_ascii=False,
                    )

                    file.flush()
                    os.fsync(file.fileno())

                temp_path.replace(path)
                return

            except PermissionError as error:
                last_error = error
                time.sleep(0.2)

            except Exception as error:
                logger.error(
                    f"Failed to write JSON file {path}: {error}"
                )
                return

        logger.error(
            f"Failed to write JSON file {path} after retries: {last_error}"
        )
    
    def _append_session_event(
        self,
        session_id: str,
        status: str,
        message: str = "",
    ) -> None:

        events_path = Path("data/session_events.json")
        events_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        with registry_lock:
            session = active_sessions.get(session_id)

            record = {
                "time": time.time(),
                "session_id": session_id,
                "user_id": session.get("user_id") if session else None,
                "game_id": session.get("game_id") if session else None,
                "status": status,
                "message": message,
            }

        events = self._safe_read_json(
            events_path,
            [],
        )

        events.append(record)
        
        events = events[-1000:]

        self._safe_write_json(
            events_path,
            events,
        )
    
    def start_session(
        self,
        request,
    ):

        with self.session_start_lock:
        
            game_id = request.game_id
            
            if not request.skip_timer:
                if request.duration < 1:
                    raise ValueError(
                        "Duration must be at least 1 minute."
                    )

                if request.duration > 480:
                    raise ValueError(
                        "Duration cannot be more than 480 minutes."
                    )

                if request.warning < 1:
                    raise ValueError(
                        "Warning time must be at least 1 minute."
                    )

                if request.warning > 60:
                    raise ValueError(
                        "Warning time cannot be more than 60 minutes."
                    )

                if request.warning >= request.duration:
                    raise ValueError(
                        "Warning time must be less than duration."
                    )

            if game_id not in save_manager.game_configs:

                raise ValueError(
                    f"Unknown game: {game_id}"
                )

            load_save = self._resolve_load_save(
                request
            )

            save_manager.validate_load_save_exists(
                user_id=request.user_id,
                game_id=game_id,
                load_save=load_save,
            )

            with registry_lock:
                for existing_session in active_sessions.values():
                    if existing_session.get("status") in [
                        "starting",
                        "running",
                        "stopping",
                        "cleaning",
                    ]:
                        raise RuntimeError(
                            "Another session is still active or cleaning. Wait until it completes before launching a new one."
                        )
            
            
            session_id = (
                save_manager.inject_saves(
                    user_id=request.user_id,
                    game_id=game_id,
                    load_save=load_save,
                )
            )

            session_thread = threading.Thread(
                target=self._run_session,
                args=(
                    session_id,
                    request,
                ),
                daemon=True,
            )

            with registry_lock:

                active_sessions[
                    session_id
                ] = {
                    "thread": session_thread,
                    "user_id": request.user_id,
                    "game_id": game_id,
                    "status": "starting",
                    "started_at": time.time(),
                    "ended_at": None,
                    "played_seconds": None,
                    "game_ended_at": None,
                    "duration": request.duration,
                    "warning": request.warning,
                    "warning_sent": False,
                    "skip_timer": request.skip_timer,
                }

            self._append_session_event(
                session_id,
                "starting",
                "Session created",
            )

            session_thread.start()

            return session_id

    def _active_sessions_path(self):
        return Path("data/active_sessions.json")

    def _persist_active_sessions(self):
        path = self._active_sessions_path()

        with registry_lock:
            snapshot = {}

            for session_id, session in active_sessions.items():
                snapshot[session_id] = {
                    "session_id": session_id,
                    "user_id": session.get("user_id"),
                    "game_id": session.get("game_id"),
                    "status": session.get("status"),
                    "started_at": session.get("started_at"),
                    "ended_at": session.get("ended_at"),
                    "played_seconds": session.get("played_seconds"),
                    "game_ended_at": session.get("game_ended_at"),
                    "duration": session.get("duration"),
                    "warning": session.get("warning"),
                    "skip_timer": session.get("skip_timer"),
                }

        self._safe_write_json(
            path,
            snapshot,
        )
    
    def _run_session(
        self,
        session_id,
        request,
    ):

        game = save_manager.game_configs[
            request.game_id
        ]

        process_name = game.process_name

        try:

            game_launcher.launch_game(
                executable_path=game.exe_path,
                session_id=session_id,
                game_id=request.game_id,
                user_id=request.user_id,
            )

            save_manager._set_state(
                session_id,
                SessionState.GAME_RUNNING,
            )

            save_manager.live_sync.start(
                session_id
            )

            with registry_lock:

                active_sessions[
                    session_id
                ]["status"] = "running"

            self._persist_active_sessions()
            
            self._append_session_event(
                session_id,
                "running",
                "Game process started",
            )
            
            asyncio.run(
                websocket_manager.broadcast(
                    {
                        "type": "status_update",
                        "session_id": session_id,
                        "status": "running",
                    }
                )
            )

            while True:

                running = (
                    game_launcher.is_process_running(
                        process_name
                    )
                )

                if not running:

                    break

                self._check_session_timeout(
                    session_id
                )

                time.sleep(5)

            game_ended_at = time.time()

            with registry_lock:
                if session_id in active_sessions:
                    started_at = active_sessions[session_id].get(
                        "started_at",
                        game_ended_at,
                    )

                    active_sessions[session_id]["game_ended_at"] = game_ended_at
                    active_sessions[session_id]["played_seconds"] = round(
                        game_ended_at - started_at,
                        2,
                    )
                    active_sessions[session_id]["status"] = "cleaning"
                        
            self._persist_active_sessions()
            
            self._append_session_event(
                session_id,
                "cleaning",
                "Game process ended, cleaning saves",
            )
            
            asyncio.run(
                websocket_manager.broadcast(
                    {
                        "type": "status_update",
                        "session_id": session_id,
                        "status": "cleaning",
                    }
                )
            )
            
            cleanup_manager.safe_cleanup(
                session_id,
                process_name,
            )

            ended_at = time.time()

            with registry_lock:
                if session_id in active_sessions:
                    started_at = active_sessions[session_id].get(
                        "started_at",
                        ended_at,
                    )

                    active_sessions[session_id]["status"] = "completed"
                    active_sessions[session_id]["ended_at"] = ended_at
                    active_sessions[session_id]["played_seconds"] = active_sessions[
                        session_id
                    ].get("played_seconds")

            self._persist_active_sessions()
            
            self._append_session_event(
                session_id,
                "completed",
                "Session completed",
            )
            
            asyncio.run(
                websocket_manager.broadcast(
                    {
                        "type": "status_update",
                        "session_id": session_id,
                        "status": "completed",
                    }
                )
            )

            with registry_lock:
                session = active_sessions.get(session_id)
                played_seconds = (
                    session.get("played_seconds", 0)
                    if session else 0
                )

            try:
                self._append_session_history(session_id)
                session_stats_manager.record_session(
                    status="completed",
                    played_seconds=played_seconds,
                )
            except Exception as history_error:
                logger.error(
                    f"Failed to append session history: {history_error}",
                    extra={"session_id": session_id},
                )
            
            time.sleep(3)

            self._cleanup_registry_entry(
                session_id
            )

        except Exception as error:

            logger.error(
                f"Session failed: {error}",
                extra={
                    "session_id": session_id
                },
            )

            try:

                cleanup_manager.force_cleanup(
                    session_id,
                    process_name,
                )

            except Exception as cleanup_error:

                logger.error(
                    f"Force cleanup failed: "
                    f"{cleanup_error}",
                    extra={
                        "session_id": session_id
                    },
                )

                lifecycle_manager.enable_recovery()

            ended_at = time.time()

            with registry_lock:
                if session_id in active_sessions:
                    started_at = active_sessions[session_id].get(
                        "started_at",
                        ended_at,
                    )

                    active_sessions[session_id]["status"] = "failed"
                    active_sessions[session_id]["ended_at"] = ended_at
                    active_sessions[session_id]["played_seconds"] = round(
                        ended_at - started_at,
                        2,
                    )
                    active_sessions[session_id]["error"] = str(error)

            self._persist_active_sessions()
            
            self._append_session_event(
                session_id,
                "failed",
                str(error),
            )
            
            asyncio.run(
                websocket_manager.broadcast(
                    {
                        "type": "status_update",
                        "session_id": session_id,
                        "status": "failed",
                    }
                )
            )
            
            with registry_lock:
                session = active_sessions.get(session_id)
                played_seconds = (
                    session.get("played_seconds", 0)
                    if session else 0
                )
            
            try:
                self._append_session_history(session_id)
                session_stats_manager.record_session(
                    status="failed",
                    played_seconds=played_seconds,
                )
            except Exception as history_error:
                logger.error(
                    f"Failed to append session history: {history_error}",
                    extra={"session_id": session_id},
                )
            
            time.sleep(3)

            self._cleanup_registry_entry(
                session_id
            )

    def get_active_sessions(self):

        sessions = []

        with registry_lock:

            for (
                session_id,
                data,
            ) in active_sessions.items():

                sessions.append(
                    {
                        "session_id": session_id,
                        "user_id": data["user_id"],
                        "game_id": data["game_id"],
                        "status": data["status"],
                        "started_at": data.get("started_at"),
                        "ended_at": data.get("ended_at"),
                        "played_seconds": data.get("played_seconds"),
                        "error": data.get("error"),
                        "game_ended_at": data.get("game_ended_at"),
                    }
                )

        return sessions

    def get_session_status(
        self,
        session_id,
    ):

        with registry_lock:

            session = active_sessions.get(
                session_id
            )

        if session is None:

            raise ValueError(
                f"Session not found: "
                f"{session_id}"
            )

        remaining = None

        if not session["skip_timer"]:

            elapsed_minutes = (
                time.time()
                - session["started_at"]
            ) / 60

            remaining = max(
                0,
                session["duration"]
                - elapsed_minutes,
            )

        return {

            "session_id": session_id,

            "user_id": session["user_id"],

            "game_id": session["game_id"],

            "status": session["status"],

            "remaining_minutes": remaining,

            "warning_sent": session[
                "warning_sent"
            ],
            
            "error": session.get("error"),

            "started_at": session.get("started_at"),
            
            "ended_at": session.get("ended_at"),
            
            "played_seconds": session.get("played_seconds"),
            
            "game_ended_at": session.get("game_ended_at"),
        }

    def _cleanup_registry_entry(
        self,
        session_id,
    ):

        with registry_lock:

            active_sessions.pop(
                session_id,
                None,
            )

        self._persist_active_sessions()
        
        logger.info(
            "Session removed from registry.",
            extra={
                "session_id": session_id
            },
        )

    def stop_session(
        self,
        session_id,
    ):

        with registry_lock:

            session = active_sessions.get(
                session_id
            )

        if session is None:

            raise ValueError(
                f"Session not found: "
                f"{session_id}"
            )

        with registry_lock:
            if session_id in active_sessions:
                active_sessions[session_id]["status"] = "stopping"

        self._persist_active_sessions()
        
        self._append_session_event(
            session_id,
            "stopping",
            "Manual stop requested",
        )
        
        asyncio.run(
            websocket_manager.broadcast(
                {
                    "type": "status_update",
                    "session_id": session_id,
                    "status": "stopping",
                }
            )
        )
        
        game_id = session["game_id"]

        game = save_manager.game_configs[
            game_id
        ]

        process_name = game.process_name

        logger.warning(
            "Manual session stop requested.",
            extra={
                "session_id": session_id
            },
        )

        game_launcher.force_close_game(
            process_name,
            session_id=session_id,
            game_id=session["game_id"],
            user_id=session["user_id"],
        )


    def _check_session_timeout(
        self,
        session_id,
    ):

        with registry_lock:

            session = active_sessions.get(
                session_id
            )

        if session is None:

            return

        if session["skip_timer"]:

            return

        started_at = session["started_at"]

        duration = session["duration"]

        warning = session["warning"]

        elapsed_minutes = (
            time.time() - started_at
        ) / 60

        remaining = (
            duration - elapsed_minutes
        )

        if (
            remaining <= warning
            and not session["warning_sent"]
        ):

            logger.warning(
                f"Only {warning} minutes "
                f"remaining in session.",
                extra={
                    "session_id": session_id
                },
            )

            with registry_lock:

                if (
                    session_id
                    in active_sessions
                ):

                    active_sessions[
                        session_id
                    ]["warning_sent"] = True

        if remaining <= 0:

            logger.warning(
                "Session timeout reached.",
                extra={
                    "session_id": session_id
                },
            )

            self.stop_session(
                session_id
            )

    def _append_session_history(
        self,
        session_id: str,
    ) -> None:

        history_path = Path("data/session_history.json")
        history_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        with registry_lock:
            session = active_sessions.get(session_id)

            if not session:
                return

            try:
                meta = save_manager.metadata_manager.get_session(session_id)
            except Exception as error:
                logger.error(
                    f"Failed to load metadata for history: {error}",
                    extra={"session_id": session_id},
                )
                meta = None
            
            record = {
                "session_id": session_id,
                "user_id": session.get("user_id"),
                "game_id": session.get("game_id"),
                "status": session.get("status"),
                "started_at": session.get("started_at"),
                "ended_at": session.get("ended_at"),
                "played_seconds": session.get("played_seconds"),
                "error": session.get("error"),
                "game_ended_at": session.get("game_ended_at"),
                "integrity_verified": getattr(meta, "integrity_verified", None),
                "latest_manifest_verified": getattr(meta, "latest_manifest_verified", None),
                "backup_manifest_verified": getattr(meta, "backup_manifest_verified", None),
                "archive_verified": getattr(meta, "archive_verified", None),
                "backup_path": getattr(meta, "backup_path", None),
                "archive_path": getattr(meta, "archive_path", None),
                "restore_verified": getattr(meta, "restore_verified", None),
                "restore_source": getattr(meta, "restore_source", None),
            }

        history = self._safe_read_json(
            history_path,
            [],
        )

        try:

            history.append(record)

        except Exception as error:

            logger.error(
                f"Failed appending history record: {error}"
            )

            return

        history = history[-500:]

        self._safe_write_json(
            history_path,
            history,
        )

    def get_session_history(
        self,
        limit: int = 20,
    ):

        history_path = Path("data/session_history.json")

        history = self._safe_read_json(
            history_path,
            [],
        )

        return list(reversed(history[-limit:]))

    def get_session_events(
        self,
        limit: int = 50,
        session_id: str | None = None,
    ):
        events_path = Path("data/session_events.json")

        events = self._safe_read_json(
            events_path,
            [],
        )

        if session_id:
            events = [
                event for event in events
                if event.get("session_id") == session_id
            ]

        return list(
            reversed(
                events[-limit:]
            )
        )

    def get_session_analytics(self):
        history = self.get_session_history(limit=10000)

        stats = session_stats_manager.read()

        total_sessions = stats[
            "total_sessions"
        ]

        total_played_seconds = stats[
            "total_playtime_seconds"
        ]

        successful_sessions = stats[
            "successful_sessions"
        ]

        failed_sessions = stats[
            "failed_sessions"
        ]

        recovered_sessions = stats[
            "recovered_sessions"
        ]

        average_playtime_seconds = (
            round(
                total_played_seconds
                / total_sessions,
                2,
            )
            if total_sessions > 0
            else 0
        )

        success_rate = (
            round(
                (successful_sessions / total_sessions) * 100,
                2,
            )
            if total_sessions > 0
            else 0
        )

        if success_rate >= 99:
            system_reliability = "Excellent"

        elif success_rate >= 95:
            system_reliability = "Good"

        elif success_rate >= 90:
            system_reliability = "Warning"

        else:
            system_reliability = "Poor"
        
        by_user = {}
        by_game = {}
        by_user_game = {}

        for item in history:
            try:
                user_id = item.get("user_id") or "unknown"
                game_id = item.get("game_id") or "unknown"
                played = item.get("played_seconds") or 0

                if user_id not in by_user:
                    by_user[user_id] = {
                        "user_id": user_id,
                        "sessions": 0,
                        "played_seconds": 0,
                    }

                by_user[user_id]["sessions"] += 1
                by_user[user_id]["played_seconds"] += played

                if game_id not in by_game:
                    by_game[game_id] = {
                        "game_id": game_id,
                        "sessions": 0,
                        "played_seconds": 0,
                    }

                by_game[game_id]["sessions"] += 1
                by_game[game_id]["played_seconds"] += played

                key = f"{user_id}::{game_id}"

                if key not in by_user_game:
                    by_user_game[key] = {
                        "user_id": user_id,
                        "game_id": game_id,
                        "sessions": 0,
                        "played_seconds": 0,
                    }

                by_user_game[key]["sessions"] += 1
                by_user_game[key]["played_seconds"] += played

            except Exception as error:

                logger.error(
                    f"Analytics skipped bad record: {error}"
                )

                continue

        def add_average(items):
            for item in items:
                sessions = item.get("sessions", 0)

                item["average_played_seconds"] = (
                    item["played_seconds"] / sessions
                    if sessions > 0
                    else 0
                )

            return items
        
        def sort_items(items):
            return sorted(
                items,
                key=lambda item: item["played_seconds"],
                reverse=True,
            )

        return {
            "total_sessions":
                total_sessions,

            "total_played_seconds":
                total_played_seconds,
            
            "successful_sessions":
                successful_sessions,

            "failed_sessions":
                failed_sessions,

            "recovered_sessions":
                recovered_sessions,

            "success_rate":
                success_rate,

            "average_playtime_seconds":
                average_playtime_seconds,
            
            "system_reliability":
                system_reliability,
            
            "by_user":
                add_average(
                    sort_items(
                        list(by_user.values())
                    )
                ),

            "by_game":
                add_average(
                    sort_items(
                        list(by_game.values())
                    )
                ),

            "by_user_game":
                add_average(
                    sort_items(
                        list(by_user_game.values())
                    )
                ),
        }

    def recover_sessions_on_startup(self):
        
        recovery_failed = False
        logger.info(
            "Checking for recoverable sessions on startup."
        )
        path = self._active_sessions_path()

        snapshot = self._safe_read_json(
            path,
            {},
        )

        if not snapshot:
            return

        recovered_history = []
        failed_sessions = []
        
        for session_id, session in snapshot.items():
            status = session.get("status")

            if status in (
                "completed",
                "failed",
            ):
                continue

            try:

                temp_dir = save_manager.host_saves / session_id / "original_backup"

                if temp_dir.exists():

                    logger.warning(
                        f"Recovering stale session host saves: "
                        f"{session_id}"
                    )

                    meta = (
                        save_manager.metadata_manager
                        .get_session(session_id)
                    )

                    if meta is not None:

                        save_manager.restore_original_saves(
                            session_id
                        )

                        logger.warning(
                            f"Host saves restored for "
                            f"stale session {session_id}"
                        )

            except Exception as error:

                recovery_failed = True

                failed_sessions.append(
                    session_id
                )

                logger.error(
                    f"Startup restore recovery failed "
                    f"for {session_id}: {error}"
                )

            started_at = session.get("started_at") or time.time()
            ended_at = time.time()

            played_seconds = session.get("played_seconds")

            if played_seconds is None:
                played_seconds = round(
                    ended_at - started_at,
                    2,
                )

            record = {
                "session_id": session_id,
                "user_id": session.get("user_id"),
                "game_id": session.get("game_id"),
                "status": "failed",
                "started_at": started_at,
                "ended_at": ended_at,
                "played_seconds": played_seconds,
                "game_ended_at": session.get("game_ended_at"),
                "error": "Recovered after backend restart",
                "integrity_verified": False,
                "latest_manifest_verified": None,
                "backup_manifest_verified": None,
                "archive_verified": None,
                "backup_path": None,
                "archive_path": None,
                "restore_verified": None,
                "restore_source": None,
            }

            recovered_history.append(record)

            session_stats_manager.record_session(
                status="failed",
                played_seconds=played_seconds,
                recovered=True,
            )

            self._append_session_event(
                session_id,
                "failed",
                "Recovered after backend restart",
            )

        if recovery_failed:

            lifecycle_manager.enable_recovery(
                f"Failed recovering "
                f"{len(failed_sessions)} "
                f"session(s): "
                f"{', '.join(failed_sessions)}"
            )

        else:

            lifecycle_manager.disable_recovery()
        
        history_path = Path("data/session_history.json")

        history = self._safe_read_json(
            history_path,
            [],
        )

        history.extend(recovered_history)

        history = history[-500:]

        self._safe_write_json(
            history_path,
            history,
        )

        self._safe_write_json(
            path,
            {},
        )
        
        logger.warning(
            f"Recovered {len(recovered_history)} unfinished session(s)."
        )

    def force_unlock_session(self):
        with registry_lock:
            active = [
                {
                    "session_id": session_id,
                    "user_id": session.get("user_id"),
                    "game_id": session.get("game_id"),
                    "status": session.get("status"),
                }
                for session_id, session in active_sessions.items()
                if session.get("status") in (
                    "starting",
                    "running",
                    "stopping",
                    "cleaning",
                )
            ]

        if active:
            return {
                "unlocked": False,
                "message": "Active session exists. Stop it before force unlock.",
                "active_sessions": active,
            }

        lock_path = Path("metadata/session.lock")

        if not lock_path.exists():
            return {
                "unlocked": False,
                "message": "No session lock exists.",
            }

        lock_path.unlink()

        logger.warning("Session lock forcefully released.")

        return {
            "unlocked": True,
            "message": "Session lock forcefully released.",
        }

    def get_session_health(self):
        lock_path = Path("metadata/session.lock")
        history_path = Path("data/session_history.json")
        events_path = Path("data/session_events.json")

        with registry_lock:
            active_count = len(active_sessions)

        history = self._safe_read_json(history_path, [])
        events = self._safe_read_json(events_path, [])

        lock_info = {}

        if lock_path.exists():

            try:

                lock_info = self._safe_read_json(
                    lock_path,
                    {},
                )

            except Exception:

                lock_info = {}
        
        return {
            "active_sessions": active_count,
            "lock_exists": lock_path.exists(),
            "session_id": lock_info.get(
                "session_id"
            ),
            "user_id": lock_info.get(
                "user_id"
            ),
            "game_id": lock_info.get(
                "game_id"
            ),
            "pid": lock_info.get(
                "pid"
            ),
            "history_count": len(history),
            "event_count": len(events),
        }

session_service = SessionService()