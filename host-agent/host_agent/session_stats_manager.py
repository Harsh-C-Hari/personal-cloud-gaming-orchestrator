from host_agent.repositories.session_stats_repository import (
    session_stats_repository,
)

class SessionStatsManager:

    def read(self):

        return session_stats_repository.read()

    def record_session(
        self,
        status,
        played_seconds,
        recovered=False,
    ):

        session_stats_repository.record_session(
            status=status,
            played_seconds=played_seconds,
            recovered=recovered,
        )

    def increment_recovered_sessions(
        self,
    ):

        session_stats_repository.increment_recovered_sessions()

session_stats_manager = (
    SessionStatsManager()
)