# Database Coding Guidelines

Short, load-bearing rules for anyone touching persistence during and
after Phase 25. Not a style guide — just the handful of rules that
keep the repository layer from eroding back into scattered file/SQL
access.

---

## 1. Never access SQLite directly from routers

`api/routes/*.py` files call **services** (`session_service`,
`save_manager`, etc.), never `sqlite3`, never a repository, never the
raw connection. Routes stay HTTP-shaped: parse the request, call a
service, shape the response.

## 2. Managers/services only talk to repositories

`session_service.py`, `save_manager.py`, `sunshine_stream_tracker.py`,
watchdogs, and every other manager/service call repository methods
(`SessionRepository.get(...)`, `RecoveryRepository.append(...)`, etc.)
— never `sqlite3.connect`, never a raw cursor, never a `.sql` string
inline in a service file. If a service needs a query a repository
doesn't yet expose, add the method to the repository — don't reach
around it.

## 3. Repositories are the only place SQL is written

All `SELECT`/`INSERT`/`UPDATE`/`DELETE` statements live inside
`repositories/*.py`. If you're writing a query anywhere else in the
codebase, it belongs in a repository instead.

## 4. Use parameterized queries — always

Every value in a query goes through a `?` placeholder. Never
f-string, `.format()`, or `%`-format a value into SQL, including
values that "can't possibly" contain user input (game IDs, internal
flags, etc.) — consistency here is what makes it safe to review.

```python
# Yes
cursor.execute("SELECT * FROM users WHERE username = ?", (username,))

# Never
cursor.execute(f"SELECT * FROM users WHERE username = '{username}'")
```

## 5. Keep transactions as short as possible

Open a transaction, do the writes it needs, commit. Don't hold a
transaction open across a network call, a file operation (save/backup
I/O), or any logic that isn't itself a database write. For the rare
multi-statement write (e.g. history + stats + event on session
completion), wrap just those statements in one `with connection:`
block — nothing else.

## 6. Don't introduce ORMs during Phase 25

Plain `sqlite3` + hand-written SQL in repositories, matching what's
already designed. No SQLAlchemy, no lightweight ORM, no query builder.
If this changes later it's a deliberate future decision, not something
that creeps in one repository at a time.

## 7. Preserve existing public interfaces where practical

When replacing a manager's internals with repository calls, preserve
existing public method names and signatures wherever practical so
callers elsewhere in the codebase require little or no change.

Only change a public interface when there is a clear architectural
benefit that outweighs the migration cost.

The database migration should be largely invisible to callers—routers,
watchdogs, background threads, and other services should continue
calling the same public APIs whenever practical.

## 8. Repositories do not create connections

Repositories receive a shared database connection (or connection factory)
through dependency injection. They do not call `sqlite3.connect(...)`
themselves.

This ensures:

- one connection configuration
- consistent PRAGMAs
- simpler transaction management
- easier future migration to another backend

> **Implementation note:** this rule was not followed as written. Every
> shipped repository (e.g. `session_stats_repository.py`,
> `user_repository.py`) calls `host_agent.database.connection.get_connection()`
> directly and opens a new connection per method call, rather than
> receiving a shared connection via dependency injection. Connection
> configuration is still centralized (all repositories go through the
> same `get_connection()` function, so PRAGMAs stay consistent), but
> there is no shared/injected connection object as this guideline
> describes.

## 9. Repositories contain data access, not business logic

Repositories are responsible only for reading and writing persistent
data.

Validation, authorization, orchestration, recovery decisions, session
lifecycle, save-management logic, and other business rules remain in
managers/services.

Repositories should not decide *what* the application should do—they
only provide the persistence operations needed by higher-level
services.

If business logic starts appearing inside a repository, move that logic
back into the appropriate service or manager.
