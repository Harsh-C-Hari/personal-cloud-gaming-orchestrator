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

### Session Filtering

Sessions are automatically extracted from log entries.

The API:

```
/admin/log-sessions
```

provides available sessions.

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
