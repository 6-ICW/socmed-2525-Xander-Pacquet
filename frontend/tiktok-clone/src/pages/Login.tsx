import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

type Mode = "login" | "register";

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && form.password !== form.confirm) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }
    if (mode === "register" && form.password.length < 8) {
      setError("Wachtwoord moet minstens 8 tekens zijn");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") await login(form.username, form.password);
      else await register(form.username, form.email, form.password);
      navigate("/");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.username?.[0]?.includes("already exists") || data?.username?.[0]?.includes("bestaat")) {
        setError("Deze gebruikersnaam bestaat al");
      } else if (data?.username) {
        setError("Gebruikersnaam: " + data.username[0]);
      } else if (data?.password) {
        setError("Wachtwoord: " + data.password[0]);
      } else if (data?.email) {
        setError("Email: " + data.email[0]);
      } else if (data?.detail) {
        setError("Gebruikersnaam of wachtwoord is onjuist");
      } else {
        setError("Er is iets misgegaan, probeer opnieuw");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    padding: "0 16px",
    backgroundColor: "#f1f1f2",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    color: "#161823",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#ffffff",
      display: "flex",
      flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>

      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 56, paddingBottom: 8 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M38.4 6.4C35.6 4.6 33.2 1.6 32.5 0H25.1V30.4C25.1 33.6 22.5 36.2 19.3 36.2S13.5 33.6 13.5 30.4 16.1 24.6 19.3 24.6c.7 0 1.3.1 1.9.3V17.2c-.6-.1-1.2-.1-1.9-.1C11.1 17.1 4 24.2 4 32.8S11.1 48.5 19.3 48.5 34.6 41.4 34.6 32.8V20.7c3 2.1 6.5 3.4 10.4 3.4v-7.5c-2.8-.1-5.5-1.3-6.6-3.2z" fill="#161823"/>
        </svg>
      </div>

      {/* Content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px",
        flex: 1,
      }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#161823",
          marginTop: 16,
          marginBottom: 4,
          textAlign: "center",
        }}>
          {mode === "login" ? "Aanmelden bij TikTok" : "Account aanmaken"}
        </h1>
        <p style={{
          color: "#606060",
          fontSize: 14,
          textAlign: "center",
          marginBottom: 28,
          lineHeight: 1.5,
        }}>
          {mode === "login"
            ? "Beheer je account, check notificaties en meer"
            : "Registreer en deel je posts met de wereld"}
        </p>

        <form onSubmit={submit} style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {/* Gebruikersnaam */}
          <input
            type="text"
            placeholder="Gebruikersnaam"
            value={form.username}
            onChange={set("username")}
            required
            autoComplete="username"
            style={inputStyle}
            onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
            onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
          />

          {/* Email — alleen bij registreren */}
          {mode === "register" && (
            <input
              type="email"
              placeholder="E-mailadres"
              value={form.email}
              onChange={set("email")}
              required
              style={inputStyle}
              onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
              onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
            />
          )}

          {/* Wachtwoord */}
          <input
            type="password"
            placeholder="Wachtwoord"
            value={form.password}
            onChange={set("password")}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            style={inputStyle}
            onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
            onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
          />

          {/* Herhaal wachtwoord — alleen bij registreren */}
          {mode === "register" && (
            <input
              type="password"
              placeholder="Herhaal wachtwoord"
              value={form.confirm}
              onChange={set("confirm")}
              required
              style={inputStyle}
              onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
              onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
            />
          )}

          {/* Foutmelding */}
          {error && (
            <p style={{ color: "#fe2c55", fontSize: 12, textAlign: "center", margin: 0 }}>
              {error}
            </p>
          )}

          {/* Wachtwoord vergeten — alleen bij login */}
          {mode === "login" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fe2c55",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}
              >
                Wachtwoord vergeten?
              </button>
            </div>
          )}

          {/* Submit knop */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 48,
              backgroundColor: loading ? "#f1849a" : "#fe2c55",
              border: "none",
              borderRadius: 6,
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              marginTop: 4,
              transition: "background-color 0.15s",
            }}
          >
            {loading ? (
              <>
                <svg
                  style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/>
                  <path fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Even wachten...
              </>
            ) : mode === "login" ? "Aanmelden" : "Registreren"}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          maxWidth: 360,
          margin: "20px 0",
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e3e3e4" }} />
          <span style={{ color: "#9e9e9e", fontSize: 12 }}>of doorgaan met</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e3e3e4" }} />
        </div>

        {/* Social knoppen */}
        <div style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {/* Google */}
          <button style={{
            width: "100%",
            height: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            border: "1px solid #e3e3e4",
            borderRadius: 6,
            backgroundColor: "white",
            fontSize: 14,
            fontWeight: 500,
            color: "#161823",
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Doorgaan met Google
          </button>

          {/* Facebook */}
          <button style={{
            width: "100%",
            height: 48,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            border: "none",
            borderRadius: 6,
            backgroundColor: "#1877F2",
            fontSize: 14,
            fontWeight: 500,
            color: "white",
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Doorgaan met Facebook
          </button>
        </div>
      </div>

      {/* Footer toggle login/register */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "24px 0",
        borderTop: "1px solid #e3e3e4",
      }}>
        <span style={{ fontSize: 14, color: "#606060" }}>
          {mode === "login" ? "Nog geen account?" : "Al een account?"}
        </span>
        <button
          onClick={() => {
            setMode(m => m === "login" ? "register" : "login");
            setError("");
            setForm({ username: "", email: "", password: "", confirm: "" });
          }}
          style={{
            background: "none",
            border: "none",
            color: "#fe2c55",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {mode === "login" ? "Registreren" : "Aanmelden"}
        </button>
      </div>
    </div>
  );
};

export default Login;