import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type Step = "email" | "code" | "newpass" | "done";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", height: 48, padding: "0 16px",
    backgroundColor: "#f1f1f2", border: "none", borderRadius: 6,
    fontSize: 14, color: "#161823", outline: "none",
    fontFamily: "inherit",
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Vul je e-mailadres in"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/password-reset/", { email });
      setStep("code");
    } catch (err: any) {
      // Toon altijd succes voor veiligheid
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const handleCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) { setError("Vul de volledige code in"); return; }
    setError("");
    setStep("newpass");
  };

  const handleNewPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) { setError("Wachtwoord moet minstens 8 tekens zijn"); return; }
    if (newPass !== confirmPass) { setError("Wachtwoorden komen niet overeen"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/password-reset/confirm/", {
        email, code, new_password: newPass,
      });
      setStep("done");
    } catch (err: any) {
      setError("Code is ongeldig of verlopen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", backgroundColor: "white",
      display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 0" }}>
        <button onClick={() => navigate("/login")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, padding: "40px 24px 0" }}>

        {/* Stap indicators */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {["email", "code", "newpass"].map((s, i) => (
            <div key={s} style={{
              width: 32, height: 4, borderRadius: 2,
              backgroundColor: ["email", "code", "newpass", "done"].indexOf(step) >= i
                ? "#fe2c55" : "#e3e3e4",
              transition: "background-color 0.3s",
            }} />
          ))}
        </div>

        {/* Stap 1 — Email */}
        {step === "email" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#fff0f3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#161823", marginBottom: 8, textAlign: "center" }}>
              Wachtwoord vergeten?
            </h1>
            <p style={{ color: "#606060", fontSize: 14, textAlign: "center", marginBottom: 32, lineHeight: 1.5 }}>
              Vul je e-mailadres in en we sturen je een code om je wachtwoord te resetten.
            </p>
            <form onSubmit={handleEmail} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email" placeholder="E-mailadres" value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                required style={inputStyle}
                onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
                onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
              />
              {error && <p style={{ color: "#fe2c55", fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                width: "100%", height: 48, backgroundColor: "#fe2c55",
                border: "none", borderRadius: 6, color: "white",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", opacity: loading ? 0.6 : 1,
              }}>
                {loading ? "Verzenden..." : "Code versturen"}
              </button>
            </form>
          </>
        )}

        {/* Stap 2 — Code */}
        {step === "code" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#fff0f3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#161823", marginBottom: 8, textAlign: "center" }}>
              Controleer je e-mail
            </h1>
            <p style={{ color: "#606060", fontSize: 14, textAlign: "center", marginBottom: 8, lineHeight: 1.5 }}>
              We hebben een code gestuurd naar
            </p>
            <p style={{ color: "#161823", fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 32 }}>
              {email}
            </p>
            <form onSubmit={handleCode} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text" placeholder="6-cijferige code" value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                maxLength={6} style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
                onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
              />
              {error && <p style={{ color: "#fe2c55", fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={code.length < 4} style={{
                width: "100%", height: 48, backgroundColor: "#fe2c55",
                border: "none", borderRadius: 6, color: "white",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", opacity: code.length < 4 ? 0.4 : 1,
              }}>
                Code bevestigen
              </button>
              <button type="button" onClick={handleEmail} style={{
                background: "none", border: "none", color: "#fe2c55",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}>
                Code opnieuw versturen
              </button>
            </form>
          </>
        )}

        {/* Stap 3 — Nieuw wachtwoord */}
        {step === "newpass" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#fff0f3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#161823", marginBottom: 8, textAlign: "center" }}>
              Nieuw wachtwoord
            </h1>
            <p style={{ color: "#606060", fontSize: 14, textAlign: "center", marginBottom: 32, lineHeight: 1.5 }}>
              Kies een nieuw wachtwoord van minstens 8 tekens.
            </p>
            <form onSubmit={handleNewPass} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="password" placeholder="Nieuw wachtwoord" value={newPass}
                onChange={e => { setNewPass(e.target.value); setError(""); }}
                style={inputStyle}
                onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
                onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
              />
              <input
                type="password" placeholder="Herhaal wachtwoord" value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setError(""); }}
                style={inputStyle}
                onFocus={e => e.target.style.backgroundColor = "#e8e8e8"}
                onBlur={e => e.target.style.backgroundColor = "#f1f1f2"}
              />
              {error && <p style={{ color: "#fe2c55", fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                width: "100%", height: 48, backgroundColor: "#fe2c55",
                border: "none", borderRadius: 6, color: "white",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", opacity: loading ? 0.6 : 1,
              }}>
                {loading ? "Opslaan..." : "Wachtwoord opslaan"}
              </button>
            </form>
          </>
        )}

        {/* Stap 4 — Klaar */}
        {step === "done" && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#f0fff4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#161823", marginBottom: 8, textAlign: "center" }}>
              Wachtwoord gewijzigd!
            </h1>
            <p style={{ color: "#606060", fontSize: 14, textAlign: "center", marginBottom: 40, lineHeight: 1.5 }}>
              Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe wachtwoord.
            </p>
            <button onClick={() => navigate("/login")} style={{
              width: "100%", maxWidth: 360, height: 48,
              backgroundColor: "#fe2c55", border: "none", borderRadius: 6,
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Terug naar aanmelden
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;