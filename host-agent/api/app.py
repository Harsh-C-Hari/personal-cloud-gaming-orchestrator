from fastapi import FastAPI
from fastapi import WebSocket

from api.routes.health import router as health_router
from api.routes.games import router as games_router
from api.routes.sessions import router as sessions_router
from api.websocket_manager import (
    websocket_manager,
)
from api.routes.saves import router as saves_router
from api.routes.host import router as host_router
from api.routes.system import (
    router as system_router,
)
from api.routes.config import router as config_router
from api.routes.admin import (
    router as admin_router
)
from fastapi.middleware.cors import (
    CORSMiddleware
)
from api.dependencies import (
    sunshine_watchdog,
    tailscale_watchdog,
    startup_manager,
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(
    title="Cloud Gaming Host Agent",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(health_router)
app.include_router(games_router)
app.include_router(sessions_router)
app.include_router(saves_router)
app.include_router(host_router)
app.include_router(system_router)
app.include_router(config_router)
app.include_router(
    admin_router,
    prefix="/admin",
)
@app.websocket("/ws")

async def websocket_endpoint(
    websocket: WebSocket,
):

    await websocket_manager.connect(
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except Exception:

        websocket_manager.disconnect(
            websocket
        )

@app.get("/")
def root():
    return {
        "status": "running",
        "service": "host-agent"
    }

@app.on_event("startup")
def startup_recovery():
    startup_manager.run()
    sunshine_watchdog.start()
    tailscale_watchdog.start()