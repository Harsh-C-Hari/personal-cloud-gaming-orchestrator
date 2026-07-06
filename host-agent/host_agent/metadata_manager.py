from __future__ import annotations

import json
import time
import threading
import os
from dataclasses import asdict
from pathlib import Path
from typing import Dict, List, Optional

from host_agent.logging_config import configure_logger
from host_agent.models import SessionMetadata

logger = configure_logger()


class MetadataManager:

    def __init__(
        self,
        metadata_path: Path,
    ) -> None:

        self.metadata_path = Path(metadata_path)

        self.metadata_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.metadata_lock = threading.Lock()
        
        if not self.metadata_path.exists():
            with self.metadata_lock:
                self._write_metadata_atomic(
                    {"sessions": {}}
                )

    def read_metadata(self) -> Dict:

        with open(
            self.metadata_path,
            "r",
            encoding="utf-8",
        ) as file:

            return json.load(file)

    def _write_metadata_atomic(
        self,
        data: Dict,
    ) -> None:

        temp_path = (
            self.metadata_path.parent
            / "session_metadata.tmp"
        )

        with open(
            temp_path,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                data,
                file,
                indent=4,
                ensure_ascii=False,
            )

            file.flush()
            os.fsync(file.fileno())

        temp_path.replace(self.metadata_path)

    def save_session(
        self,
        session_id: str,
        metadata: SessionMetadata,
    ) -> None:

        with self.metadata_lock:
        
            data = self.read_metadata()

            data["sessions"][session_id] = asdict(
                metadata
            )

            self._write_metadata_atomic(data)

            logger.info(
                f"Session metadata saved: {session_id}",
                extra={
                    "session_id": session_id,
                    "user_id": metadata.user_id,
                    "game_id": metadata.game_id,
                },
            )

    def get_session(
        self,
        session_id: str,
    ) -> Optional[SessionMetadata]:

        data = self.read_metadata()

        session_data = data["sessions"].get(
            session_id
        )

        if session_data is None:
            return None

        return SessionMetadata(**session_data)

    def update_session_state(
        self,
        session_id: str,
        state: str,
    ) -> None:

        with self.metadata_lock:
        
            metadata = self.read_metadata()

            if session_id not in metadata["sessions"]:

                logger.error(
                    f"Session not found for update: "
                    f"{session_id}"
                )

                return

            metadata["sessions"][session_id][
                "state"
            ] = state

            metadata["sessions"][session_id][
                "updated_at"
            ] = int(time.time())

            self._write_metadata_atomic(metadata)

            logger.info(
                f"Session state updated: "
                f"{session_id} → {state}",
                extra={"session_id": session_id},
            )

    def update_session_field(
        self,
        session_id: str,
        field: str,
        value: object,
    ) -> None:

        with self.metadata_lock:
        
            metadata = self.read_metadata()

            if session_id not in metadata["sessions"]:

                logger.error(
                    f"Session not found for field "
                    f"update: {session_id}"
                )

                return

            metadata["sessions"][session_id][
                field
            ] = value

            metadata["sessions"][session_id][
                "updated_at"
            ] = int(time.time())

            self._write_metadata_atomic(metadata)

    def list_sessions(
        self,
        user_id: Optional[str] = None,
        game_id: Optional[str] = None,
    ) -> List[SessionMetadata]:

        data = self.read_metadata()

        results = []

        for session_data in data[
            "sessions"
        ].values():

            if (
                user_id
                and session_data.get("user_id")
                != user_id
            ):
                continue

            if (
                game_id
                and session_data.get("game_id")
                != game_id
            ):
                continue

            results.append(
                SessionMetadata(**session_data)
            )

        return results

    def delete_session(
        self,
        session_id: str,
    ) -> None:

        with self.metadata_lock:
        
            data = self.read_metadata()

            if session_id in data["sessions"]:

                del data["sessions"][session_id]

                self._write_metadata_atomic(data)

                logger.info(
                    f"Session metadata deleted: "
                    f"{session_id}"
                )