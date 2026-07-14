# Stream Management

The stream management subsystem tracks Sunshine stream activity independently from session state.

---

## Goals

The system separates:

- game lifecycle
- session lifecycle
- stream lifecycle
- transport lifecycle

This prevents network failures from immediately terminating gameplay sessions.

---

## Stream State Tracking

Stream state information is persisted using:

```text
sunshine_stream_state.json
```

Stored information includes:

- active stream
- connected client
- stream start time
- disconnect state

---

## Stream History

Historical stream information is stored in:

```text
sunshine_stream_history.json
```

This enables:

- diagnostics
- analytics
- reconnect investigation

---

## Sunshine Hooks

Sunshine Do and Undo hooks are used to detect stream activity.

### Do Hook

Triggered when a client connects.

Used for:

- stream registration
- ownership tracking
- analytics

### Undo Hook

Triggered when a client disconnects.

Used for:

- disconnect detection
- cleanup scheduling
- recovery handling

---

## Transport Monitoring

Transport monitoring tracks:

- active streams
- disconnect events
- reconnect events

Transport failures do not automatically terminate sessions.

---

## Lifecycle Separation

Example:

```text
Game Alive
Session Alive
Stream Dead
Transport Dead
```

The session continues to exist and may later reconnect.

---

## Benefits

- disconnect resilience
- future reconnect support
- analytics collection
- stream diagnostics