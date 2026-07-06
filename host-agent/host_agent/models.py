from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import List
from typing import Optional

class SessionState(str, Enum):

    INITIALIZING = "initializing"
    LOCKED = "locked"
    SAVES_BACKED_UP = "saves_backed_up"
    SAVES_INJECTED = "saves_injected"
    GAME_RUNNING = "game_running"
    GAME_EXITED = "game_exited"
    SAVES_STABILIZED = "saves_stabilized"
    SAVES_CAPTURED = "saves_captured"
    VERSIONED = "versioned"
    ARCHIVED = "archived"
    RESTORED = "restored"
    CLEANED_UP = "cleaned_up"
    FAILED = "failed"

@dataclass
class SaveProfile:
    game_id: str
    user_id: str
    profile_path: Path


@dataclass
class SaveFilters:
    mode: str
    prefix: list[str]
    contains: list[str]
    suffix: list[str]


@dataclass
class GameConfig:
    id: str
    name: str
    exe_name: str
    exe_path: str
    save_path: str
    process_name: str
    save_filters: SaveFilters

@dataclass
class SessionLock:
    session_id: str
    user_id: str
    game_id: str
    locked_at: int
    pid: int


@dataclass
class SessionMetadata:
    session_id: str
    user_id: str
    game_id: str
    exe_name: str
    game_save_path: str
    backup_path: str
    state: str
    created_at: int
    updated_at: int

    ended_at: Optional[int] = None
    crash_recovery_required: Optional[bool] = None
    latest_save_hash: Optional[str] = None
    
    injected_save_hash: Optional[str] = None
    archive_hash: Optional[str] = None
    archive_path: Optional[str] = None

    latest_manifest_verified: Optional[bool] = None
    backup_manifest_verified: Optional[bool] = None
    archive_verified: Optional[bool] = None
    integrity_verified: Optional[bool] = None
    restore_verified: Optional[bool] = None
    restore_source: Optional[str] = None

    live_sync_triggered: bool = False
    live_sync_count: int = 0
    live_sync_last_time: int | None = None
    live_sync_preserved: bool = False
    live_sync_hash: str | None = None
    live_sync_fallback: bool = False
    backup_failed: bool = False
    archive_failed: bool = False
    cleanup_result: str | None = None
    
@dataclass
class FileChangeSet:
    changed: List[Path]
    new: List[Path]
    deleted: List[Path]


@dataclass
class HealthStatus:
    healthy: bool
    metadata_valid: bool
    lock_valid: bool
    paths_valid: bool
    write_permissions: bool
    issues: List[str] = field(default_factory=list)
