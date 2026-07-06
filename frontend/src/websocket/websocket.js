/**
 * websocket/websocket.js
 *
 * Standalone WebSocket client class. Framework-agnostic — no React here.
 * useWebSocket.js wraps this in a hook.
 *
 * Backend WS contract (from api/websocket_manager.py + session_service.py):
 *   Endpoint : ws://host:8000/ws
 *   Protocol : JSON text frames
 *   Events broadcast by backend:
 *     { type: "status_update", session_id: string, status: "running" | "completed" | "failed" }
 *
 *   NOT broadcast:
 *     - "starting"  → set synchronously in registry before thread starts
 *     - "stopped"   → set by stop_session() with no broadcast; detect via polling
 */

const RECONNECT_DELAY_MS = 3_500;

export class WSClient {
  /** @type {WebSocket | null} */
  #ws = null;

  /** @type {boolean} */
  #destroyed = false;

  /** @type {ReturnType<typeof setTimeout> | null} */
  #reconnectTimer = null;

  /** @type {((connected: boolean) => void) | null} */
  #onConnectionChange = null;

  /** @type {((event: object) => void) | null} */
  #onMessage = null;

  /**
   * @param {string} url  Full WebSocket URL, e.g. "ws://localhost:8000/ws"
   */
  constructor(url) {
    this.url = url;
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Register a handler for connection state changes.
   * @param {(connected: boolean) => void} handler
   */
  onConnectionChange(handler) {
    this.#onConnectionChange = handler;
    return this;
  }

  /**
   * Register a handler for incoming JSON messages.
   * Handler receives the parsed object; malformed frames are silently dropped.
   * @param {(event: object) => void} handler
   */
  onMessage(handler) {
    this.#onMessage = handler;
    return this;
  }

  /** Open the connection (idempotent). */
  connect() {
    this.#destroyed = false;
    this.#openSocket();
  }

  /**
   * Permanently close the connection and stop all reconnect attempts.
   * Call this in React cleanup (useEffect return fn).
   */
  destroy() {
    this.#destroyed = true;
    clearTimeout(this.#reconnectTimer);
    this.#ws?.close();
    this.#ws = null;
  }

  // ── Private ───────────────────────────────────────────────────────────

  #openSocket() {
    if (this.#destroyed) return;

    const ws = new WebSocket(this.url);
    this.#ws = ws;

    ws.onopen = () => {
      if (this.#destroyed) { ws.close(); return; }
      this.#onConnectionChange?.(true);
    };

    ws.onclose = () => {
      if (this.#destroyed) return;
      this.#onConnectionChange?.(false);
      // Schedule reconnect
      this.#reconnectTimer = setTimeout(
        () => this.#openSocket(),
        RECONNECT_DELAY_MS,
      );
    };

    ws.onerror = () => {
      // onerror is always followed by onclose; let onclose drive reconnect
      ws.close();
    };

    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        this.#onMessage?.(parsed);
      } catch {
        // Drop malformed frames silently
      }
    };
  }
}
