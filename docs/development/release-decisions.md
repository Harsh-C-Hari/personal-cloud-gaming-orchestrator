# v0.1 Release Decisions

## Optional Streaming Dependencies

Sunshine and Tailscale currently enhance remote connectivity but are not required for local session execution.

Session launch restrictions based on Sunshine and Tailscale status were removed for v0.1.

Future phases involving:

- User applications
- Session reconnection
- Moonlight automation

may reintroduce these requirements.

---

## GPU Validation

The original implementation relied on nvidia-smi.

This was insufficient for:

- AMD GPUs
- Intel GPUs
- Hybrid graphics systems

GPU validation currently relies on host capability detection through HostMonitor.