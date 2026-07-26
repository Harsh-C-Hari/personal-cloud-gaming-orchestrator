/**
 * components/ui/ErrorBoundary.jsx
 *
 * If any component in the wrapped subtree throws during render (bad API
 * response shape, null access, etc.), React unmounts that subtree. Without
 * this, the user sees a blank white page with no way to recover.
 *
 * Error boundaries must be class components — there is no hook equivalent
 * (no useErrorBoundary in stable React). This is intentionally the ONLY
 * class component in the app.
 *
 * Usage (see App.jsx):
 *   <ErrorBoundary>
 *     <Dashboard />
 *   </ErrorBoundary>
 */

import { Component } from "react";
import { FaExclamationTriangle, FaRedo, FaSyncAlt, FaChevronDown } from "react-icons/fa";

const palette = {
  bg: "#060810",
  card: "#0b0e16",
  border: "#1c2130",
  text: "#e2e8f0",
  dim: "#94a3b8",
  faint: "#64748b",
  muted: "#475569",
  accent: "#38bdf8",
  danger: "#f43f5e",
  mono: "'JetBrains Mono', monospace",
  display: "'Rajdhani', sans-serif",
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the component stack around for the collapsible details panel,
    // and still log to the console the way an uncaught error normally would.
    this.setState({ info });
    console.error("Uncaught error in component tree:", error, info);
  }

  handleTryAgain = () => {
    this.setState({ error: null, info: null, showDetails: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  render() {
    const { error, info, showDetails } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          background: palette.bg,
          color: palette.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            background: palette.card,
            border: `1px solid ${palette.border}`,
            borderRadius: "12px",
            padding: "26px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.35)",
              color: palette.danger,
              marginBottom: "16px",
            }}
          >
            <FaExclamationTriangle size={18} />
          </div>

          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: palette.text,
              fontFamily: palette.display,
              letterSpacing: "0.02em",
            }}
          >
            Something went wrong
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: palette.dim,
              fontFamily: palette.mono,
              lineHeight: 1.6,
            }}
          >
            The app hit an unexpected error and couldn't continue. Your session
            and data on the host are unaffected — try again, or reload the page.
          </div>

          {error?.message && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "7px",
                background: "rgba(244,63,94,0.06)",
                border: "1px solid rgba(244,63,94,0.2)",
                color: "#fca5a5",
                fontSize: "10.5px",
                fontFamily: palette.mono,
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
            <button
              onClick={this.handleTryAgain}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "10px",
                borderRadius: "7px",
                border: `1px solid ${palette.border}`,
                background: "transparent",
                color: palette.dim,
                fontSize: "11px",
                fontFamily: palette.mono,
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              <FaRedo size={10} />
              Try Again
            </button>

            <button
              onClick={this.handleReload}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "10px",
                borderRadius: "7px",
                border: "1px solid rgba(56,189,248,0.45)",
                background: "rgba(56,189,248,0.1)",
                color: palette.accent,
                fontSize: "11px",
                fontFamily: palette.mono,
                fontWeight: 700,
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              <FaSyncAlt size={10} />
              Reload Page
            </button>
          </div>

          {info?.componentStack && (
            <div style={{ marginTop: "14px" }}>
              <button
                onClick={this.toggleDetails}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  color: palette.faint,
                  fontSize: "9.5px",
                  fontFamily: palette.mono,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <FaChevronDown
                  size={9}
                  style={{ transform: showDetails ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                />
                Technical details
              </button>

              {showDetails && (
                <pre
                  style={{
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "7px",
                    background: "rgba(2,6,23,0.6)",
                    border: `1px solid ${palette.border}`,
                    color: palette.muted,
                    fontSize: "9.5px",
                    fontFamily: palette.mono,
                    lineHeight: 1.5,
                    maxHeight: "180px",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {info.componentStack.trim()}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
