import { useState } from "react";
import { api, storeSession } from "../api";
import TopoBackground from "../components/TopoBackground";
import { Spinner } from "../components/Atoms";

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password || (mode === "signup" && !name)) {
      setError("Fill in all fields to continue.");
      return;
    }
    setLoading(true);
    try {
      const data =
        mode === "login" ? await api.login(email, password) : await api.signup(email, password, name);
      storeSession(data.token, data.user);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message || "Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <TopoBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 className="display" style={{ fontSize: 40, margin: 0 }}>Nearby</h1>
          <p style={{ color: "var(--stone)", marginTop: 8, fontSize: 15 }}>
            Find something good, right now.
          </p>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {mode === "signup" && (
            <div>
              <label className="field-label">Name</label>
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="field-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "var(--stone)",
                  borderRadius: "50%",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading && <Spinner />}
            {mode === "login" ? "Log in" : "Create account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: "var(--stone)", margin: 0 }}>
            {mode === "login" ? (
              <>No account yet?{" "}
                <button type="button" className="btn-text" onClick={() => { setMode("signup"); setError(""); }}>
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" className="btn-text" onClick={() => { setMode("login"); setError(""); }}>
                  Log in
                </button>
              </>
            )}
          </p>
        </form>

        <p style={{ marginTop: 28, fontSize: 12, color: "var(--stone-soft)", textAlign: "center" }}>
          Demo login: priya@demo.app / password123
        </p>
      </div>
    </div>
  );
}