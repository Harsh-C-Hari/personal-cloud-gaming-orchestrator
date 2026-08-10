from __future__ import annotations

import threading
import time
from typing import List, Optional

from host_agent.logging_config import configure_logger
from host_agent.models import SessionMetadata
from host_agent.repositories.session_metadata_repository import (
    session_metadata_repository,
)

logger = configure_logger()


class MetadataManager:

    def __init__(
        self,
        metadata_path=None,
    ) -> None:

        # Kept only for constructor compatibility.
        # Session metadata is now persisted in SQLite.
        self.metadata_path = metadata_path

        self.metadata_lock = threading.Lock()

    def read_metadata(self) -> dict:

        records = (
            session_metadata_repository.list()
        )

        return {
            "sessions": {
                record["session_id"]: record
                for record in records
            }
        }

    def save_session(
        self,
        session_id: str,
        metadata: SessionMetadata,
    ) -> None:

        with self.metadata_lock:

            record = {
                "session_id": session_id,
                **metadata.__dict__,
            }

            # Ensure the explicit session_id argument
            # remains authoritative.
            record["session_id"] = session_id

            session_metadata_repository.save(
                record
            )

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

        record = (
            session_metadata_repository.get(
                session_id
            )
        )

        if record is None:
            return None

        return SessionMetadata(
            **record
        )

    def update_session_state(
        self,
        session_id: str,
        state: str,
    ) -> None:

        with self.metadata_lock:

            if (
                session_metadata_repository.get(
                    session_id
                )
                is None
            ):

                logger.error(
                    f"Session not found for update: "
                    f"{session_id}"
                )

                return

            updated_at = int(
                time.time()
            )

            session_metadata_repository.update_state(
                session_id,
                state,
                updated_at,
            )

            logger.info(
                f"Session state updated: "
                f"{session_id} → {state}",
                extra={
                    "session_id": session_id
                },
            )

    def update_session_field(
        self,
        session_id: str,
        field: str,
        value: object,
    ) -> None:

        with self.metadata_lock:

            if (
                session_metadata_repository.get(
                    session_id
                )
                is None
            ):

                logger.error(
                    f"Session not found for field "
                    f"update: {session_id}"
                )

                return

            updated_at = int(
                time.time()
            )

            session_metadata_repository.update_field(
                session_id,
                field,
                value,
                updated_at,
            )

    def list_sessions(
        self,
        user_id: Optional[str] = None,
        game_id: Optional[str] = None,
    ) -> List[SessionMetadata]:

        records = (
            session_metadata_repository.list(
                user_id=user_id,
                game_id=game_id,
            )
        )

        return [
            SessionMetadata(**record)
            for record in records
        ]

    def delete_session(
        self,
        session_id: str,
    ) -> None:

        with self.metadata_lock:

            session_metadata_repository.delete(
                session_id
            )

            logger.info(
                f"Session metadata deleted: "
                f"{session_id}"
            )