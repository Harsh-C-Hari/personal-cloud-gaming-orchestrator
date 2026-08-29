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
import { AlertTriangle, RotateCcw, RefreshCw, ChevronDown } from "lucide-react";
import { colors, fonts, radius, shadow } from "../../dashboard/theme.js";

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
          background: colors.bg,
          color: colors.ink,
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
            background: colors.bgCard,
            border: `1.5px solid ${colors.border}`,
            borderRadius: `${radius.lg}px`,
            padding: "26px",
            boxShadow: shadow.overlay,
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: `${radius.sm}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,107,107,0.14)",
              border: "1.5px solid rgba(255,107,107,0.35)",
              color: colors.danger,
              marginBottom: "16px",
            }}
          >
            <AlertTriangle size={20} strokeWidth={2} />
          </div>

          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: colors.ink,
              fontFamily: fonts.display,
              letterSpacing: "-0.005em",
            }}
          >
            Something went wrong
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "12.5px",
              color: colors.inkDim,
              fontFamily: fonts.body,
              fontWeight: 500,
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
                borderRadius: `${radius.sm}px`,
                background: "rgba(255,107,107,0.08)",
                border: "1.5px solid rgba(255,107,107,0.25)",
                color: colors.danger,
                fontSize: "10.5px",
                fontFamily: fonts.mono,
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
                borderRadius: `${radius.full}px`,
                border: `1.5px solid ${colors.borderInk}`,
                background: "transparent",
                color: colors.ink,
                fontSize: "12px",
                fontFamily: fonts.body,
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} strokeWidth={2} />
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
                borderRadius: `${radius.full}px`,
                border: "1.5px solid transparent",
                background: colors.ink,
                color: colors.bg,
                fontSize: "12px",
                fontFamily: fonts.body,
                fontWeight: 700,
                letterSpacing: "0.02em",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} strokeWidth={2} />
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
                  color: colors.inkFaint,
                  fontSize: "10px",
                  fontFamily: fonts.body,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  // motion-audit (P6-T04): 0.2s (200ms) plain `ease`-default
                  // does not exactly match any `motion` step (fast=100ms,
                  // base=160ms, cardIn=220ms, pill=180ms cubic-bezier) —
                  // left as a literal, not converted.
                  style={{ transform: showDetails ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                />
                Technical details
              </button>

              {showDetails && (
                <pre
                  style={{
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: `${radius.sm}px`,
                    background: colors.bgInset,
                    border: `1.5px solid ${colors.border}`,
                    color: colors.inkFaint,
                    fontSize: "9.5px",
                    fontFamily: fonts.mono,
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
