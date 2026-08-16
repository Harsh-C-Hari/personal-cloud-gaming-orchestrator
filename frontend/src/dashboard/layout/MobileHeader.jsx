import { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import { colors, fonts, nav, radius, shadow } from "../theme.js";

export function MobileHeader({ open, items, activeRoute, onNavigate, closeButtonRef, onClose }) {
  const drawerRef = useRef(null);

  useLayoutEffect(() => {
    if (!drawerRef.current) return;
    if (open) {
      drawerRef.current.removeAttribute("inert");
      drawerRef.current.inert = false;
    } else {
      drawerRef.current.setAttribute("inert", "");
      drawerRef.current.inert = true;
    }
  }, [open]);

  return (
    <div ref={drawerRef} className="pcgo-mobile-nav" aria-hidden={!open} style={{ position: "fixed", top: `${nav.headerHeight}px`, left: 0, bottom: 0, width: "min(310px, 88vw)", display: "flex", flexDirection: "column", borderRight: `1px solid ${colors.border}`, background: colors.bgElevated, boxShadow: open ? shadow.overlay : "none", zIndex: 45, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease", pointerEvents: open ? "auto" : "none", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${colors.borderSubtle}`, flexShrink: 0 }}>
        <div>
          <div style={{ color: colors.ink, font: `650 15px/1.2 ${fonts.display}` }}>Navigation</div>
          <div style={{ color: colors.inkFaint, font: `500 10px/1.2 ${fonts.mono}`, marginTop: 4 }}>{items.length} destinations</div>
        </div>
        <button ref={closeButtonRef} type="button" tabIndex={open ? 0 : -1} onClick={onClose} aria-label="Close navigation menu" style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.inkDim, cursor: "pointer" }}><X size={17} /></button>
      </div>
      <div style={{ padding: "12px 10px", display: "grid", gap: 4, overflowY: "auto" }}>
        {items.map((item) => {
          const active = item.route === activeRoute;
          return <button key={item.route} type="button" tabIndex={open ? 0 : -1} onClick={() => { onNavigate(item.route); onClose(); }} aria-current={active ? "page" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 46, padding: "11px 12px", borderRadius: radius.sm, border: `1px solid ${active ? colors.brandDim : "transparent"}`, background: active ? colors.brandDim : "transparent", color: active ? colors.ink : colors.inkDim, fontSize: 13.5, fontFamily: fonts.body, fontWeight: active ? 650 : 500, cursor: "pointer", textAlign: "left" }}>
            <span style={{ color: active ? colors.brand : colors.inkFaint, width: 19, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>;
        })}
      </div>
    </div>
  );
}
