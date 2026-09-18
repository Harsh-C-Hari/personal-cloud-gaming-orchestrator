/**
 * components/ui/ConfirmDialog.jsx
 *
 * Replaces native window.confirm() popups with a themed modal.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm("Delete this game? This cannot be undone.", {
 *     danger: true,
 *     confirmLabel: "Delete",
 *   });
 *   if (!ok) return;
 *
 * Mounted once, high up the tree (see App.jsx) via <ConfirmDialogProvider>.
 */

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { colors, fonts, radius, shadow } from "../../dashboard/theme.js";

const ConfirmContext = createContext(null);

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => element.getAttribute("aria-hidden") !== "true");
}

function getFallbackFocusTarget() {
  const candidates = document.querySelectorAll(
    'nav[aria-label="Primary navigation"] button[aria-current="page"]:not([disabled]), main button:not([disabled]), main a[href], main input:not([disabled]), main select:not([disabled]), button[aria-label="Toggle navigation menu"]'
  );
  const target = [...candidates].find((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
  if (target) return target;

  const main = document.querySelector("main");
  if (main) {
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    return main;
  }
  return null;
}

function restoreFocusAfterClose(appContentRef, opener) {
  let attempts = 0;
  function attempt() {
    if (appContentRef.current) {
      appContentRef.current.inert = false;
      appContentRef.current.removeAttribute("inert");
      appContentRef.current.removeAttribute("aria-hidden");
    }

    const target = opener?.isConnected && !opener.disabled && opener.getAttribute("aria-hidden") !== "true"
      ? opener
      : getFallbackFocusTarget();

    if (target?.isConnected && !target.disabled && target.getAttribute("aria-hidden") !== "true") {
      target.focus({ preventScroll: true });
    }

    attempts += 1;
    if (attempts < 20) window.setTimeout(attempt, 50);
  }
  window.setTimeout(attempt, 0);
}

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const appContentRef = useRef(null);
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const openerRef = useRef(null);
  const instanceId = useId().replace(/:/g, "");
  const titleId = `confirm-dialog-title-${instanceId}`;
  const messageId = `confirm-dialog-message-${instanceId}`;

  const close = useCallback(
    (result) => {
      if (!dialog) return;
      const opener = openerRef.current;
      openerRef.current = null;
      dialog.resolve(result);
      setDialog(null);

      restoreFocusAfterClose(appContentRef, opener);
    },
    [dialog]
  );

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      const activeElement = document.activeElement;
      openerRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      setDialog({
        message,
        title: opts.title ?? (opts.danger ? "Are you sure?" : "Confirm"),
        confirmLabel: opts.confirmLabel ?? "Confirm",
        cancelLabel: opts.cancelLabel ?? "Cancel",
        danger: opts.danger ?? false,
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    const appContent = appContentRef.current;
    if (!appContent) return undefined;
    appContent.inert = Boolean(dialog);
    if (dialog) appContent.setAttribute("aria-hidden", "true");
    else appContent.removeAttribute("aria-hidden");
    return () => {
      appContent.inert = false;
      appContent.removeAttribute("inert");
      appContent.removeAttribute("aria-hidden");
    };
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return undefined;

    const frame = window.requestAnimationFrame(() => {
      (confirmButtonRef.current || cancelButtonRef.current || dialogRef.current)?.focus({ preventScroll: true });
    });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusableElements(dialogRef.current);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event) {
      if (dialogRef.current?.contains(event.target)) return;
      event.preventDefault();
      (confirmButtonRef.current || cancelButtonRef.current || dialogRef.current)?.focus({ preventScroll: true });
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, [dialog, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      <div ref={appContentRef} style={{ display: "contents" }}>{children}</div>

      {dialog && (
        <div
          role="presentation"
          onClick={() => close(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            // motion-audit (P6-T04): keyframe-based entrance `animation:`
            // (name + forwards fill-mode), not a `transition:` — same
            // non-convertible category as primitives.jsx's Spinner
            // (P6-T02). Left as a literal, not converted.
            animation: "confirm-backdrop-in 0.15s ease forwards",
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "380px",
              maxHeight: "min(85vh, 85dvh)",
              overflowY: "auto",
              background: colors.bgCard,
              // Per §6.3: dialog panel is a structural module surface
              // (the binary `radius.none` rectangle), with a heavier
              // `borderInk` to mark it as a discrete attention boundary
              // on a backdrop-scrim canvas. The 1.5px ink-tier stroke is
              // also the brand "frame" line — the dialog is the single
              // most heavy-bordered surface in the app, intentionally,
              // because it's the one place where we want maximum edge
              // legibility against the rgba(0,0,0,0.6) backdrop. Was
              // `border: 1.5px solid ${colors.border}` + `radius.lg` (16px).
              border: `1.5px solid ${colors.borderInk}`,
              borderRadius: `${radius.none}px`,
              padding: "20px",
              // Per the shadow family: `shadow.overlay` (kept blur) is
              // reserved for true modal overlays — `shadow.lift` (3px
              // 3px) is for soft-floating card depth, `shadow.press`
              // (2px 2px) is for inverted/pressed state. A modal
              // dialog floating over a backdrop scrim is the canonical
              // "true overlay" use case, so `shadow.overlay` stays.
              boxShadow: shadow.overlay,
              // motion-audit (P6-T04): keyframe-based entrance `animation:`.
              // 180ms duration coincidentally matches motion.pill's 180ms,
              // but motion.pill's easing is a distinct
              // cubic-bezier(0.4,0,0.2,1) curve, not plain `ease` — a
              // duration-only match is not a genuine exact match, and this
              // is keyframe-based (name + forwards fill-mode) besides, same
              // non-convertible category as primitives.jsx's Spinner
              // (P6-T02). Left as a literal, not converted.
              animation: "confirm-card-in 0.18s ease forwards",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                style={{
                  flexShrink: 0,
                  width: "34px",
                  height: "34px",
                  // Per §6.4: icon badge is a `<span>`-scale accent chip,
                  // the sanctioned `radius.tight` (4px) exception. Was
                  // `radius.sm` (8px).
                  borderRadius: `${radius.tight}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: dialog.danger ? "rgba(255,107,107,0.14)" : "rgba(224,164,88,0.14)",
                  border: `1.5px solid ${dialog.danger ? "rgba(255,107,107,0.35)" : "rgba(224,164,88,0.3)"}`,
                  color: dialog.danger ? colors.danger : colors.brand,
                }}
              >
                {dialog.danger ? <AlertTriangle size={16} strokeWidth={2} /> : <HelpCircle size={16} strokeWidth={2} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  id={titleId}
                  style={{
                    fontSize: "14.5px",
                    fontWeight: 700,
                    color: colors.ink,
                    fontFamily: fonts.display,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {dialog.title}
                </div>
                <div
                  id={messageId}
                  style={{
                    marginTop: "6px",
                    fontSize: "12.5px",
                    color: colors.inkDim,
                    fontFamily: fonts.body,
                    fontWeight: 500,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}
                >
                  {dialog.message}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button
                ref={cancelButtonRef}
                onClick={() => close(false)}
                style={{
                  flex: 1,
                  padding: "9px",
                  minHeight: "44px",
                  // Per §6.4: dialog footer CTAs are the sanctioned
                  // `radius.full` (999px) pill exception — the primary
                  // action affordance on a destructive-confirm surface
                  // should NOT be visually demoted to a `radius.tight`
                  // (4px) rectangle. The pill shape is the loudest,
                  // highest-tension button geometry in the system, and
                  // the dialog footer is the one place where the user
                  // needs to feel the action weight. Left as `radius.full`.
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
                onMouseEnter={(event) => (event.currentTarget.style.background = "rgba(237,235,227,0.08)")}
                onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
              >
                {dialog.cancelLabel}
              </button>

              <button
                ref={confirmButtonRef}
                onClick={() => close(true)}
                style={{
                  flex: 1,
                  padding: "9px",
                  minHeight: "44px",
                  // Per §6.4: see Cancel button above — `radius.full`
                  // (999px) is the sanctioned pill CTA geometry for the
                  // dialog footer, intentional visual weight on the
                  // primary action. Not converted to `radius.tight`.
                  borderRadius: `${radius.full}px`,
                  border: `1.5px solid transparent`,
                  background: dialog.danger ? colors.danger : colors.ink,
                  color: colors.bg,
                  fontSize: "12px",
                  fontFamily: fonts.body,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                }}
                onMouseEnter={(event) => (event.currentTarget.style.filter = "brightness(1.06)")}
                onMouseLeave={(event) => (event.currentTarget.style.filter = "none")}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confirm-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confirm-card-in {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm() must be used within a <ConfirmDialogProvider>");
  }
  return ctx;
}
