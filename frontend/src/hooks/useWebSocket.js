/**
 * hooks/useWebSocket.js
 *
 * React hook that owns a WSClient instance for its lifetime.
 * Provides:
 *   connected  — current connection state
 *   lastEvent  — most recent parsed WS message (null until first event)
 *
 * The onEvent callback is called for every incoming message.
 * It is stored in a ref so callers can use inline functions without
 * triggering reconnects on every render.
 *
 * Usage:
 *   const { connected } = useWebSocket((event) => {
 *     if (event.type === "status_update") { ... }
 *   });
 */

import { useEffect, useRef, useState } from "react";
import { WSClient } from "../websocket/websocket.js";

// In dev, Vite proxies /ws → ws://localhost:8000/ws.
// In production use the absolute WS URL of your host-agent.
const WS_URL = `ws://127.0.0.1:8100/ws`;

/**
 * @param {((event: object) => void) | undefined} onEvent
 *   Callback invoked for every incoming WS message.
 *   Safe to change between renders — stored in a ref.
 */
export function useWebSocket(onEvent) {
  const [connected, setConnected] = useState(false);

  // Keep callback ref so we never re-create the socket when onEvent changes
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const client = new WSClient(WS_URL);

    client
      .onConnectionChange((isConnected) => setConnected(isConnected))
      .onMessage((event) => onEventRef.current?.(event));

    client.connect();

    return () => client.destroy();
  }, []); // mount once

  return { connected };
}
