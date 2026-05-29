import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../App";
import BottomNav from "../components/BottemNav";

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [music, setMusic] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!image) { setError("Kies eerst een afbeelding"); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("description", description);
      fd.append("music", music || "Origineel geluid");
      fd.append("music_artist", musicArtist);
      await api.post("/posts/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      navigate("/profile");
    } catch (err: any) {
      setError("Post mislukt: " + (err.response?.data?.detail || "probeer opnieuw"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "relative", width: "100%", height: "100dvh",
      backgroundColor: "black", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top),12px) 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "white", fontSize: 14 }}>
          Annuleren
        </button>
        <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Nieuwe post</span>
        <button
          onClick={submit}
          disabled={loading || !image}
          style={{
            background: "none", border: "none", cursor: image ? "pointer" : "default",
            color: image ? "#fe2c55" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700,
          }}
        >
          {loading ? "..." : "Posten"}
        </button>
      </div>

      <div className="no-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {/* Afbeelding kiezen */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            margin: 16, borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "2px dashed rgba(255,255,255,0.2)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: 260, cursor: "pointer", overflow: "hidden", position: "relative",
          }}
        >
          {preview ? (
            <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          ) : (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Tik om een foto te kiezen</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 4 }}>JPG, PNG, WEBP</p>
            </>
          )}
        </div>
        {preview && (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              display: "block", margin: "-8px auto 16px",
              background: "none", border: "none", color: "#fe2c55",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Andere foto kiezen
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

        {/* Formulier */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
              BESCHRIJVING
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={2200}
              rows={4}
              placeholder="Beschrijf je post... gebruik #hashtags"
              style={{
                width: "100%", padding: "12px 14px",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, color: "white", fontSize: 14,
                outline: "none", fontFamily: "inherit", resize: "none",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, float: "right", marginTop: 4 }}>
              {description.length}/2200
            </span>
          </div>

          <div>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
              MUZIEK (optioneel)
            </label>
            <input
              value={music}
              onChange={e => setMusic(e.target.value)}
              placeholder="Naam van het nummer"
              style={{
                width: "100%", padding: "12px 14px",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, color: "white", fontSize: 14,
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
              ARTIEST (optioneel)
            </label>
            <input
              value={musicArtist}
              onChange={e => setMusicArtist(e.target.value)}
              placeholder="Naam van de artiest"
              style={{
                width: "100%", padding: "12px 14px",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, color: "white", fontSize: 14,
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "#fe2c55", fontSize: 13, textAlign: "center" }}>{error}</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Upload;