import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/paperwork/quote";

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. Check your email if confirmation is enabled.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(from, { replace: true });
      }
    } catch (err) {
      setMsg(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "40px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>{mode === "signup" ? "Create account" : "Sign in"}</h1>
      <p style={{ color: "#6b7280" }}>Login to access your paperwork templates & saved numbers.</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>EMAIL</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>PASSWORD</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
          style={{ background: "transparent", border: "none", color: "#111", textDecoration: "underline" }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        {msg ? <div style={{ color: "#b91c1c" }}>{msg}</div> : null}
      </form>
    </div>
  );
}