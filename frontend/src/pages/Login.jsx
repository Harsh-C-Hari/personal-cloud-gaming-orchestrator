import { useEffect, useState } from "react";
import { User, Lock, LogIn, ShieldCheck, Info, TriangleAlert, ArrowUpRight, Activity } from "lucide-react";
import { login, setToken, bootstrapRequired, bootstrapAdmin } from "../api/client";
import { useToast } from "../components/ui/Toast.jsx";
import { Button } from "../components/ui/primitives.jsx";
import { colors, fonts, motion, radius, shadow } from "../dashboard/theme.js";

// P6-T07 motion audit: both properties on this transition were an exact
// "160ms ease" match to motion.base (verified against theme.js's real,
// current value), so this is a genuine token-alias conversion — same
// precedent as PageHeader.jsx's motion.base template-literal conversion
// (P6-T03). Same duration/easing, zero visual change.
const inputStyle = { width: "100%", minHeight: 46, padding: "11px 13px 11px 39px", background: colors.bgInset, border: `1px solid ${colors.border}`, borderRadius: radius.sm, color: colors.ink, fontSize: 13.5, fontFamily: fonts.body, boxSizing: "border-box", transition: `border-color ${motion.base}, background ${motion.base}` };

function FieldLabel({ icon, children }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10, fontWeight: 700, color: colors.inkFaint, letterSpacing: ".12em", textTransform: "uppercase", fontFamily: fonts.mono, marginBottom: 8 }}>{icon}{children}</span>;
}

function BrandMark() {
  return <div aria-hidden="true" style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 28 }}>{[10, 17, 25].map((height, index) => <span key={height} style={{ width: 4, height, borderRadius: 2, background: index === 2 ? colors.brand : colors.inkDim }} />)}</div>;
}

export default function Login() {
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkBootstrap() {
      try { const result = await bootstrapRequired(); setBootstrapMode(result.required); }
      catch { setBootstrapMode(false); }
    }
    checkBootstrap();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    try {
      setSubmitting(true);
      const result = bootstrapMode ? await bootstrapAdmin(username, password) : await login(username, password);
      if (result.access_token) {
        setToken(result.access_token);
        localStorage.setItem("username", result.username);
        localStorage.setItem("role", result.role);
        window.location.reload();
      } else {
        setBootstrapMode(false);
        toast.success("Admin created successfully. Please login.");
      }
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(360px, 0.8fr)", background: colors.bg, color: colors.ink, overflowY: "auto" }}>
      <section style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "clamp(28px, 6vw, 84px)", borderRight: `1px solid ${colors.border}`, minHeight: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><BrandMark /><span style={{ font: `700 16px/1 ${fonts.display}`, letterSpacing: ".06em" }}>CLOUD GAMING <span style={{ color: colors.brand }}>ORCHESTRATOR</span></span></div>
        <div style={{ maxWidth: 610, padding: "72px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.brand, font: `600 10px/1 ${fonts.mono}`, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 24 }}><Activity size={14} /> Personal gaming infrastructure</div>
          <h1 style={{ margin: 0, maxWidth: 580, font: `600 clamp(42px, 6vw, 82px)/.98 ${fonts.display}`, letterSpacing: "-.055em", color: colors.ink }}>Your games.<br /><span style={{ color: colors.brand }}>Your control plane.</span></h1>
          <p style={{ margin: "28px 0 0", maxWidth: 500, color: colors.inkDim, font: `400 clamp(15px, 1.7vw, 19px)/1.55 ${fonts.body}` }}>Orchestrate sessions, protect saves, monitor the host, and keep streaming infrastructure ready from one calm operational console.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 34 }}>
            {["Session control", "Host health", "Recovery aware"].map((item) => <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1px solid ${colors.border}`, borderRadius: radius.sm, color: colors.inkDim, font: `500 11px/1 ${fonts.mono}` }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.brand }} />{item}</span>)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.inkGhost, font: `500 10px/1.3 ${fonts.mono}`, letterSpacing: ".04em" }}>PCGO / SINGLE-HOST ORCHESTRATION <ArrowUpRight size={13} /></div>
      </section>

      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 24px", background: colors.bgElevated }}>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 420, border: `1px solid ${colors.border}`, borderRadius: radius.lg, background: colors.bgCard, overflow: "hidden", boxShadow: shadow.overlay }}>
          <div style={{ padding: "28px 28px 24px", borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.inkFaint, font: `600 10px/1 ${fonts.mono}`, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 15 }}>{bootstrapMode ? "First-run setup" : "Secure access"}</div>
            <h2 style={{ margin: 0, font: `600 29px/1.08 ${fonts.display}`, letterSpacing: "-.03em" }}>{bootstrapMode ? "Create your admin" : "Welcome back"}</h2>
            <p style={{ margin: "10px 0 0", color: colors.inkFaint, font: `400 13px/1.55 ${fonts.body}` }}>{bootstrapMode ? "Create the first administrator for this host." : "Sign in to manage your gaming infrastructure."}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 17, padding: 28 }}>
            {bootstrapMode && <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 12px", borderRadius: radius.sm, background: colors.accentBlueDim, border: `1px solid rgba(140,196,232,0.3)`, color: colors.inkDim, font: `400 12px/1.45 ${fonts.body}` }}><Info size={14} style={{ marginTop: 1, flexShrink: 0, color: colors.accentBlue }} /> No admin account detected. Create the first administrator.</div>}
            <div><FieldLabel icon={<User size={12} />}>Username</FieldLabel><div style={{ position: "relative" }}><User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: colors.inkFaint, pointerEvents: "none" }} /><input aria-label="Username" type="text" placeholder="Enter your username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} style={inputStyle} onFocus={(event) => { event.target.style.borderColor = colors.brand; event.target.style.background = colors.bgCardHover; }} onBlur={(event) => { event.target.style.borderColor = colors.border; event.target.style.background = colors.bgInset; }} /></div></div>
            <div><FieldLabel icon={<Lock size={12} />}>Password</FieldLabel><div style={{ position: "relative" }}><Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: colors.inkFaint, pointerEvents: "none" }} /><input aria-label="Password" type="password" placeholder="Enter your password" autoComplete={bootstrapMode ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} onFocus={(event) => { event.target.style.borderColor = colors.brand; event.target.style.background = colors.bgCardHover; }} onBlur={(event) => { event.target.style.borderColor = colors.border; event.target.style.background = colors.bgInset; }} /></div></div>
            {error && <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 12px", borderRadius: radius.sm, background: colors.dangerDim, border: `1px solid rgba(240,127,131,0.3)`, color: colors.danger, font: `400 12px/1.45 ${fonts.body}` }}><TriangleAlert size={14} style={{ marginTop: 1, flexShrink: 0 }} />{error}</div>}
            <Button type="submit" variant="primary" disabled={submitting} style={{ width: "100%", minHeight: 46, marginTop: 3 }}>{bootstrapMode ? <ShieldCheck size={15} /> : <LogIn size={15} />}{submitting ? (bootstrapMode ? "Creating account…" : "Signing in…") : (bootstrapMode ? "Register Admin" : "Sign in")}</Button>
          </div>
        </form>
      </section>
      <style>{`@media (max-width: 860px) { main { display: block !important; } main > section:first-child { min-height: auto !important; padding: 28px 24px 32px !important; border-right: 0 !important; border-bottom: 1px solid ${colors.border} !important; } main > section:first-child > div:nth-child(2) { padding: 50px 0 20px !important; } main > section:first-child h1 { font-size: 48px !important; } main > section:last-child { min-height: 560px; } } @media (max-width: 420px) { main > section:first-child h1 { font-size: 39px !important; } main > section:last-child { padding: 26px 16px !important; } form > div { padding-left: 20px !important; padding-right: 20px !important; } }`}</style>
    </main>
  );
}
