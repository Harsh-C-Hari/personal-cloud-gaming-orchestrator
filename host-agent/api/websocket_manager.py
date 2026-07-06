from fastapi import WebSocket


class WebSocketManager:

    def __init__(self):

        self.connections = []

    async def connect(
        self,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.connections.append(
            websocket
        )

    def disconnect(
        self,
        websocket: WebSocket,
    ):

        if websocket in self.connections:

            self.connections.remove(
                websocket
            )

    async def broadcast(
        self,
        message: dict,
    ):

        dead_connections = []

        for connection in self.connections:

            try:

                await connection.send_json(
                    message
                )

            except Exception:

                dead_connections.append(
                    connection
                )

        for connection in dead_connections:

            self.disconnect(
                connection
            )


websocket_manager = (
    WebSocketManager()
)