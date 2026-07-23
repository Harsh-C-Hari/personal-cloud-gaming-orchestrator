from pathlib import Path
import re

LOG_FILE = Path(
    "logs/host_agent.log"
)

def read_logs(
    level=None,
    session=None,
    search=None,
    limit=200,
    allowed_sessions=None,
):

    if not LOG_FILE.exists():

        return {
            "logs": [],
            "warnings": 0,
            "errors": 0,
        }

    with open(
        LOG_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        lines = file.readlines()

    if allowed_sessions is not None:

        allowed_sessions = set(allowed_sessions)

        lines = [
            line
            for line in lines
            if any(
                f"[session={session_id}]"
                in line
                for session_id in allowed_sessions
            )
        ]
    
    if level:

        lines = [
            line
            for line in lines
            if f"[{level}]"
            in line
        ]

    if session:

        lines = [
            line
            for line in lines
            if f"[session={session}]"
            in line
        ]

    if search:

        search = str(search).lower()

        lines = [
            line
            for line in lines
            if search in line.lower()
        ]

    filtered = [
        line.rstrip()
        for line in lines[-limit:]
    ]

    warnings = sum(
        "[WARNING]" in line
        for line in filtered
    )

    errors = sum(
        "[ERROR]" in line
        for line in filtered
    )

    return {
        "logs": filtered,
        "warnings": warnings,
        "errors": errors,
    }

def available_sessions(
    allowed_sessions=None,
):

    sessions = []

    if not LOG_FILE.exists():
        return []

    with open(
        LOG_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        for line in file:

            match = re.search(
                r"\[session=(.*?)\]",
                line,
            )

            if match:

                session = match.group(1)

                if (
                    allowed_sessions is not None
                    and session not in allowed_sessions
                ):
                    continue
                
                if (
                    session and
                    session != "-" and
                    session not in sessions
                ):
                    sessions.append(
                        session
                    )

    sessions.reverse()

    return sessions