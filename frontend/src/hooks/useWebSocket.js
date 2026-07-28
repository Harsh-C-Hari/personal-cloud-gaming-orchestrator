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
import { getToken, getApiUrl  } from "../api/client.js";

// In dev, Vite proxies /ws → ws://localhost:8000/ws.
// In production use the absolute WS URL of your host-agent.
const BASE_URL = getApiUrl("/ws");
const WS_URL = BASE_URL.replace("http", "ws");

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
    const token = getToken();
    const url = token
      ? `${WS_URL}?token=${encodeURIComponent(token)}`
      : WS_URL;
    const client = new WSClient(url);

    client
      .onConnectionChange((isConnected) => setConnected(isConnected))
      .onMessage((event) => onEventRef.current?.(event));

    client.connect();

    return () => client.destroy();
  }, []); // mount once

  return { connected };
}
