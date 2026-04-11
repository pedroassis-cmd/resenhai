import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    // Substitute with your auth logic
    setTimeout(() => {
      setLoading(false);
      onLogin?.({ email: form.email, name: form.name || form.email.split("@")[0] });
    }, 1200);
  };

  const googleLogin = () => {
    setLoading(true);
    // Substitute with your Google OAuth flow
    setTimeout(() => {
      setLoading(false);
      onLogin?.({ email: "usuario@gmail.com", name: "Usuário Google" });
    }, 1000);
  };

  return (
    <div style={styles.root}>
      {/* Background texture */}
      <div style={styles.pitch} />
      <div style={styles.overlay} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚽</span>
          <span style={styles.logoText}>Pelada<span style={styles.logoAccent}>App</span></span>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["login", "signup"].map((t) => (
            <button
              key={t}
              style={{ ...styles.tab, ...(mode === t ? styles.tabActive : {}) }}
              onClick={() => { setMode(t); setError(""); }}
            >
              {t === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Nome</label>
              <input
                name="name"
                placeholder="Seu nome"
                value={form.name}
                onChange={handle}
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>E-mail</label>
            <input
              name="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={form.email}
              onChange={handle}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <div style={styles.passWrap}>
              <input
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                required
                minLength={6}
                style={{ ...styles.input, paddingRight: 40 }}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Confirmar senha</label>
              <input
                name="confirm"
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handle}
                required
                style={styles.input}
              />
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -6 }}>
              <button type="button" style={styles.forgotBtn}>
                Esqueci a senha
              </button>
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span style={styles.spinner} />
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>ou</span>
          <div style={styles.dividerLine} />
        </div>

        <button style={styles.googleBtn} onClick={googleLogin} disabled={loading}>
          <GoogleIcon />
          <span>Continuar com Google</span>
        </button>

        <p style={styles.footerNote}>
          Ao continuar, você concorda com os{" "}
          <span style={styles.link}>Termos de uso</span> e a{" "}
          <span style={styles.link}>Política de privacidade</span>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

const G = "#1cb85b";
const GD = "#0f8c3f";
const CARD_BG = "rgba(10,20,14,0.94)";

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#06120a",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  },
  pitch: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,0.025) 48px, rgba(255,255,255,0.025) 50px),
      repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.025) 48px, rgba(255,255,255,0.025) 50px)
    `,
    backgroundSize: "50px 50px",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(28,184,91,0.12) 0%, transparent 70%)",
  },
  card: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: 400,
    margin: "0 16px",
    background: CARD_BG,
    borderRadius: 20,
    border: "1px solid rgba(28,184,91,0.2)",
    padding: "36px 32px 28px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(28,184,91,0.08)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
  },
  logoIcon: { fontSize: 28 },
  logoText: {
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.5px",
    fontFamily: "'DM Sans', sans-serif",
  },
  logoAccent: { color: G },
  tabs: {
    display: "flex",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  tabActive: {
    background: G,
    color: "#fff",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  passWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
  },
  error: {
    background: "rgba(226,75,74,0.15)",
    border: "1px solid rgba(226,75,74,0.3)",
    color: "#f87171",
    fontSize: 13,
    padding: "8px 12px",
    borderRadius: 8,
  },
  forgotBtn: {
    background: "none",
    border: "none",
    color: G,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  submitBtn: {
    marginTop: 4,
    padding: "13px 0",
    background: G,
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    transition: "background 0.2s",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "18px 0",
  },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.1)" },
  dividerText: { fontSize: 12, color: "rgba(255,255,255,0.3)" },
  googleBtn: {
    width: "100%",
    padding: "11px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "inherit",
    transition: "background 0.2s",
  },
  footerNote: {
    marginTop: 16,
    fontSize: 11,
    color: "rgba(255,255,255,0.28)",
    textAlign: "center",
    lineHeight: 1.6,
  },
  link: { color: G, cursor: "pointer" },
};
