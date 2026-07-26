# Administrative Features

## Administrative Log Viewer

The administrative log viewer provides operational visibility into host activity.

### Features

* Log filtering by level.
* Session filtering.
* Case-insensitive search.
* Warning and error statistics.
* Live mode.
* Pause mode.
* Log export.

### Supported Levels

* INFO
* WARNING
* ERROR

### Access Scope

The log viewer is available to every authenticated account, but the data it shows depends on role:

* **Admin:** the complete host log, via `/admin/logs`, `/admin/log-sessions`, and `/admin/logs/download`.
* **Standard user:** only log entries belonging to that user's own sessions, via `/admin/my-logs`, `/admin/my-log-sessions`, and `/admin/my-logs/download`.

The user-scoped endpoints filter by the session IDs owned by the requesting account (`session_service.get_user_session_ids`) before returning results, so a standard user cannot see another user's session activity even though the endpoint requires no special role.

### Session Filtering

Sessions are automatically extracted from log entries.

The API:

```
/admin/log-sessions        (admin: all sessions)
/admin/my-log-sessions     (user: own sessions only)
```

provides available sessions for the filter dropdown.

### Search

Search supports:

* Case-insensitive matching.
* Live updates.
* Debounced input.

### Export

Supported exports:

* Full log export.
* Filtered export.

Example filenames:

```
warning_913048b3.log
error_cleanup.log
host_logs.log
```

---

## Session-Aware Logging

Session metadata is attached to operational log records.

Available metadata:

* session_id
* game_id
* user_id

This information is included in:

* Game launching.
* Process monitoring.
* Cleanup operations.
* Save operations.
* Recovery operations.
* Live synchronization.

---

## Log Navigation

The viewer implements administrative log behavior.

### Live Updates

When viewing the latest logs:

* New entries follow automatically.

When viewing older entries:

* Scroll position is preserved.

### Bottom Navigation

A floating navigation button allows quick return to the newest entries.

---

## Benefits

Administrative logging provides:

* Session reconstruction.
* Failure analysis.
* Cleanup tracking.
* Save operation tracing.
* Recovery investigation.
* Operational visibility.
