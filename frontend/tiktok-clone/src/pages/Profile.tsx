import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../App";
import { Post } from "../types";
import BottomNav from "../components/BottemNav";

const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" :
  n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : String(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
const EditProfileModal: React.FC<{
  profile: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}> = ({ profile, onClose, onSave }) => {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [email,setEmail] = useState(profile.email||"")
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("display_name", displayName);
      fd.append("bio", bio);
      fd.append("email",email)
      if (avatarFile) fd.append("avatar", avatarFile);
      const { data } = await api.patch("/users/me/update/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSave(data);
      onClose();
    } catch (err: any) {
      setError("Opslaan mislukt, probeer opnieuw");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{
      position: "absolute", inset: 0, zIndex: 60,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top),12px) 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "white", fontSize: 14 }}>
          Annuleren
        </button>
        <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Profiel bewerken</span>
        <button onClick={save} disabled={loading} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#fe2c55", fontSize: 14, fontWeight: 700,
          opacity: loading ? 0.5 : 1,
        }}>
          {loading ? "..." : "Opslaan"}
        </button>
      </div>

      <div className="no-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", backgroundColor: "#444" }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "white", fontSize: 32, fontWeight: 700 }}>{profile.username?.[0]?.toUpperCase()}</span>
                  </div>
              }
            </div>
            <button onClick={() => fileRef.current?.click()} style={{
              position: "absolute", bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: "50%",
              backgroundColor: "#fe2c55", border: "2px solid black",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
          </div>
          <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: "#fe2c55", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Foto wijzigen
          </button>
        </div>

        {/* Velden */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
              WEERGAVENAAM
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={30}
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
              EMAIL
            </label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={30}
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
              BIO
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={150}
                rows={4}
                style={{
                  width: "100%", padding: "12px 14px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8, color: "white", fontSize: 14,
                  outline: "none", fontFamily: "inherit",
                  resize: "none",
                }}
              />
              <span style={{ position: "absolute", bottom: 8, right: 10, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                {bio.length}/150
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p style={{ color: "#fe2c55", fontSize: 13, textAlign: "center", marginTop: 16 }}>{error}</p>
        )}
      </div>
    </div>
  );
};

// ─── Profile Page ─────────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user: me, logout } = useAuth();
  const navigate = useNavigate();
  const isOwn = !userId || Number(userId) === me?.id;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "liked" | "saved">("posts");
  const [following, setFollowing] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const id = userId || me?.id;
    if (!id) { setLoading(false); return; }

    Promise.all([
      api.get(`/users/${id}/`),
      api.get(`/users/${id}/posts/`),
    ])
      .then(([u, p]) => {
        setProfile(u.data);
        setPosts(p.data.results ?? p.data);
        setFollowing(u.data.is_following ?? false);
      })
      .catch(() => {
        if (isOwn && me) setProfile(me as any);
      })
      .finally(() => setLoading(false));
  }, [userId, me?.id]);

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    setProfile((p: any) => p ? {
      ...p, followers_count: p.followers_count + (next ? 1 : -1)
    } : p);
    try {
      await api.post(`/users/${profile?.id}/follow/`);
    } catch {
      setFollowing(!next);
      setProfile((p: any) => p ? {
        ...p, followers_count: p.followers_count + (next ? -1 : 1)
      } : p);
    }
  };

  if (loading) return (
    <div style={{ height: "100dvh", width: "100%", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "#fe2c55", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  const p = profile || me;

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", backgroundColor: "black", display: "flex", flexDirection: "column" }}>

      {/* Edit modal */}
      {showEdit && (
        <EditProfileModal
          profile={p}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => setProfile(updated)}
        />
      )}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top),12px) 16px 12px",
      }}>
        {!isOwn
          ? <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
          : <div style={{ width: 24 }} />
        }
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>@{p?.username}</span>
          {p?.is_verified && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#20d5ec">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
        </div>
        {isOwn
          ? <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          : <div style={{ width: 22 }} />
        }
      </div>

      <div className="no-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {/* Profielinfo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 16px" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", backgroundColor: "#444", border: "2px solid rgba(255,255,255,0.2)", marginBottom: 12 }}>
            {p?.avatar
              ? <img src={p.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: 36, fontWeight: 700 }}>{p?.username?.[0]?.toUpperCase()}</span>
                </div>
            }
          </div>

          <p style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
            {p?.display_name || p?.username}
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 28, margin: "12px 0" }}>
            {[
              { value: p?.following_count ?? 0, label: "Volgend" },
              { value: p?.followers_count ?? 0, label: "Volgers" },
              { value: p?.likes_count ?? 0, label: "Likes" },
            ].map(stat => (
              <div key={stat.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{fmt(stat.value)}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {p?.bio && (
            <p style={{ color: "white", fontSize: 13, textAlign: "center", maxWidth: 280, marginBottom: 12, lineHeight: 1.4 }}>
              {p.bio}
            </p>
          )}

          {/* Actieknoppen */}
          {isOwn ? (
            <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 320 }}>
              <button onClick={() => setShowEdit(true)} style={{
                flex: 1, height: 36,
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6, color: "white", fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                Profiel bewerken
              </button>
              <button style={{
                flex: 1, height: 36,
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6, color: "white", fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                Profiel delen
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 320 }}>
              <button onClick={toggleFollow} style={{
                flex: 1, height: 36, borderRadius: 6,
                backgroundColor: following ? "rgba(255,255,255,0.1)" : "#fe2c55",
                border: following ? "1px solid rgba(255,255,255,0.2)" : "none",
                color: "white", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                {following ? "Volgend" : "Volgen"}
              </button>
              <button onClick={async () => {
                  try {
                    const { data } = await api.post("/inbox/start/", { user_id: profile.id });
                    navigate("/inbox", { state: { openConvo: data } });
                  } catch {
                    navigate("/inbox");
                  }
                }} style={{
                  flex: 1, height: 36,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 6, color: "white", fontSize: 13,
                  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Bericht
              </button>
              <button style={{
                width: 36, height: 36,
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { key: "posts", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
            { key: "liked", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            { key: "saved", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "12px 0", background: "none", border: "none", cursor: "pointer",
              color: tab === t.key ? "white" : "rgba(255,255,255,0.4)",
              borderBottom: tab === t.key ? "2px solid white" : "2px solid transparent",
            }}>
              {t.icon}
            </button>
          ))}
        </div>

        {/* Foto grid */}
        {posts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "rgba(255,255,255,0.4)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p style={{ fontSize: 14 }}>Nog geen posts</p>
            {isOwn && (
              <button onClick={() => navigate("/upload")} style={{
                marginTop: 16, padding: "10px 24px",
                backgroundColor: "#fe2c55", border: "none", borderRadius: 6,
                color: "white", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Eerste post maken
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginTop: 2 }}>
            {posts.map(post => (
              <button key={post.id} onClick={() => setSelected(post)} style={{
                position: "relative", aspectRatio: "9/16",
                overflow: "hidden", backgroundColor: "#1a1a1a",
                border: "none", cursor: "pointer", padding: 0,
              }}>
                <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 6, left: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span style={{ color: "white", fontSize: 11, fontWeight: 600, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                    {fmt(post.likes_count)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post detail modal */}
      {selected && (
        <div className="fade-in" style={{
          position: "absolute", inset: 0, zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.92)",
          display: "flex", flexDirection: "column",
        }} onClick={() => setSelected(null)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(env(safe-area-inset-top),12px) 16px 12px" }}>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <span style={{ color: "white", fontWeight: 600, fontSize: 16 }}>Post</span>
            <div style={{ width: 24 }} />
          </div>

          <div className="no-scroll" style={{ flex: 1, overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
            <div style={{ padding: 16 }}>
              <p style={{ color: "white", fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
                {selected.description}{" "}
                {selected.hashtags.map(t => (
                  <span key={t} style={{ color: "#69c9d0", fontWeight: 600 }}>#{t} </span>
                ))}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fe2c55">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{fmt(selected.likes_count)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{fmt(selected.comments_count)}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginLeft: "auto" }}>
                  {fmtDate(selected.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;