Built a project I've been working on for quite some time:

Personal Cloud Gaming Orchestrator v0.1

The goal was to transform a personal gaming PC into a remotely accessible cloud gaming platform while keeping full ownership and control of the infrastructure.

Tech Stack:

• Python
• FastAPI
• React
• Sunshine
• Tailscale
• WebSockets
• JWT Authentication

Key features:

* Session Management
* Save Synchronization
* Live Save Protection
* Host Monitoring
* Recovery Systems
* Sunshine Watchdog & Client Management
* Tailscale Recovery
* Session Analytics
* Real-Time Dashboard
* Authentication & Role-Based Access (Admin / User)

Some of the most interesting engineering challenges involved:

* Designing reliable save synchronization workflows
* Building automated recovery systems
* Implementing stale session recovery after backend failures
* Solving dashboard synchronization issues caused by browser caching
* Reducing unnecessary save operations using hash-based change detection
* Authenticating non-user callers (Sunshine's own hook script and a log-tailing background thread) with a scoped shared secret instead of a user credential

The v0.1 Host Foundation Release is complete.

Session Persistence & Reconnection and Authentication & Authorization have both since been completed.

Looking forward to continuing development through database migration, a dedicated user application, deployment tooling, and additional reliability improvements.
