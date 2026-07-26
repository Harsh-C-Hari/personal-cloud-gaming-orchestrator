"""
api/internal_event_auth.py

Access control for the four Sunshine *event* endpoints that record what
Sunshine is actually doing right now:

    POST /host/sunshine/stream-started
    POST /host/sunshine/stream-ended
    POST /host/sunshine/transport-connected
    POST /host/sunshine/transport-disconnected

These are not admin actions and were never part of the user-facing API
surface — they exist purely so that:

    - sunshine_stream_hook.py        (an external script Sunshine itself
                                       invokes on stream start/stop)
    - host_agent/sunshine_transport_monitor.py
                                      (an in-process background thread
                                       tailing Sunshine's log file)

can report state changes back into this process. Neither caller is a
logged-in user or a request from the frontend, so neither carries — or
should carry — a JWT.

Why a shared secret, not a Python-level check:
sunshine_stream_hook.py runs as a *separate OS process*, invoked directly
by Sunshine. By the time its HTTP request reaches this server, there is no
Python call stack left to inspect — "only file X may call this" doesn't
exist as a runtime concept across a process boundary. The only real
enforcement point still available is the network request itself, which
means a credential the request must carry. So this is deliberately the
same shape as a webhook signing secret: a bearer credential scoped to
exactly one trust boundary, generated once (see
host_agent/startup_initializer.py:_ensure_internal_event_token), stored
in config.json next to `backend.internal_api_url`, and never handed to
the frontend, to any admin action, or to any other backend module.
Comparison uses hmac.compare_digest so a timing attack can't leak it.

require_internal_event_token() is the *only* place this check happens.
Every other backend module (routers, services, admin code, user code)
should keep calling sunshine_stream_tracker's read-only getters if it
needs stream state — none of them import or duplicate this check, and
none of them have the token to pass even if they tried.
"""

import hmac
import secrets

from fastapi import Header, HTTPException

from host_agent.config_manager import config_manager
from host_agent.logging_config import configure_logger

logger = configure_logger()

HEADER_NAME = "X-Internal-Event-Token"


def _get_internal_event_token() -> str:
    """
    Reads the shared secret from config.json. Fresh installs get it from
    DEFAULT_CONFIG + startup_initializer at boot, so in normal operation
    this always finds one already there. The generate-and-persist branch
    below only exists as a safety net for a config.json that predates
    this token (e.g. a manual/partial upgrade) and should be a no-op on
    every subsequent call.
    """

    token = config_manager.get(
        "backend",
        "internal_event_token",
        default="",
    )

    if token:
        return token

    token = secrets.token_urlsafe(32)

    config_manager.update(
        "backend",
        {"internal_event_token": token},
    )

    logger.warning(
        "backend.internal_event_token was missing and has been "
        "generated. If sunshine_stream_hook.py or the transport monitor "
        "were already running, restart them so they pick up the new "
        "token from config.json."
    )

    return token


def require_internal_event_token(
    x_internal_event_token: str = Header(
        default="",
        alias=HEADER_NAME,
    ),
):
    """
    FastAPI dependency. Attach via the route's `dependencies=[...]` list
    (see api/routes/host.py) rather than as a function parameter — these
    routes don't need the token value itself, just the guarantee that the
    caller had it.
    """

    expected = _get_internal_event_token()

    if not x_internal_event_token or not hmac.compare_digest(
        x_internal_event_token,
        expected,
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "This endpoint may only be called by the Sunshine "
                "stream hook / transport monitor."
            ),
        )
