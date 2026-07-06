# Interview Notes

## Project Summary

Personal Cloud Gaming Orchestrator is a cloud gaming management platform that transforms a gaming PC into a remotely accessible gaming server.

The system focuses on session orchestration, save synchronization, monitoring, diagnostics, and automated recovery.

---

# Why Did You Build It?

I wanted to understand how a complete cloud gaming platform could be built using modern backend, frontend, networking, monitoring, and recovery systems.

The project also provided practical experience with systems design and reliability engineering.

---

# Most Difficult Problem Solved

The most difficult engineering challenge was designing reliable Tailscale recovery.

Unlike a normal Windows application or service, Tailscale has multiple components that must work together to provide a healthy connection.

Through investigation, I discovered that Tailscale operation depends on both the main service and the Tailscale IPN backend process. A healthy state requires these components to be operating correctly together.

Understanding the internal behavior of Tailscale required approximately one week of research, testing, and failure analysis.

The challenge was that Tailscale can enter multiple unhealthy states, and each state requires a different recovery strategy.

Examples:

* Service stopped → Execute `tailscale up`
* Unknown service state → Restart the Tailscale process
* NoState condition → Restart the Tailscale IPN backend

Some states, such as authentication or login-related failures, currently require manual intervention because automated recovery is not safely possible.

The final implementation introduced a diagnostic-driven recovery model where the platform identifies the current Tailscale condition, selects the appropriate recovery workflow, validates the recovery result, and records the outcome.

This transformed the Tailscale watchdog from a simple restart mechanism into a state-aware recovery system.


---

# Most Interesting Reliability Feature

Stale Session Recovery.

If the backend crashes during an active session:

* Stale sessions are detected
* Locks are released
* History is corrected
* Recovery events are recorded

This allows the platform to recover automatically without manual intervention.

---

# What Did You Learn?

* FastAPI architecture
* React dashboard development
* API design
* WebSockets
* Monitoring systems
* Recovery systems
* Reliability engineering
* Debugging complex state issues
* Documentation and project organization

---

# Future Development

Planned future phases include:

* Session persistence
* Authentication
* Database migration
* User applications
* Moonlight automation
* Deployment tooling
* Audit logging
