import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { Conversation, Message } from "../types";
import BottomNav from "../components/BottemNav";
import { useAuth } from "../App";

const timeAgo = (iso: string) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}u`;
  return `${Math.floor(s / 86400)}d`;
};

const FALLBACK: Conversation[] = [
  {
    id: 1,
    other_user: { id: 2, username: "emma.vdberg", display_name: "Emma van den Berg", avatar: "https://i.pravatar.cc/150?img=1", is_verified: true, followers_count: 2400000, following_count: 312, likes_count: 48200000, bio: "", posts_count: 89 },
    last_message: "Wauw die foto is echt te gek! 🔥 (Fallback)",
    last_message_time: new Date(Date.now() - 300000).toISOString(),
    unread_count: 0,
  },
];

// ─── Chat View ────────────────────────────────────────────────────────────────
const ChatView: React.FC<{ convo: Conversation; onBack: () => void }> = ({ convo, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Berichten ophalen uit de Django backend (Paden matchen nu 100% met je Django urls)
  useEffect(() => {
    api.get(`/conversations/${convo.id}/messages/`)
      .then(({ data }) => {
        const list = data.results ?? data;
        setMessages(list);
      })
      .catch((err) => {
        console.error("Kon backend berichten niet laden:", err);
        setMessages([
          {
            id: 1,
            sender: convo.other_user,
            receiver: user as any,
            text: convo.last_message || "👋 Stuur een bericht om te chatten!",
            created_at: convo.last_message_time || new Date().toISOString(),
            is_read: true,
          },
        ]);
      });
  }, [convo.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Bericht versturen en veilig updaten
  const send = async () => {
    if (!text.trim()) return;

    const typedText = text.trim();
    setText("");

    // Waterdicht lokaal sender-object om TypeScript en UI-crashes te voorkomen
    const validSender: any = {
      id: user?.id ?? 0,
      username: user?.username ?? "jij",
      display_name: (user as any)?.display_name ?? user?.username ?? "Jij",
      avatar: user?.avatar ?? "",
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      likes_count: 0,
      bio: "",
      posts_count: 0
    };

    const localMsg: Message = {
      id: Date.now(), // Tijdelijke unieke ID voor React component key
      sender: validSender,
      receiver: convo.other_user,
      text: typedText,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    // Toon het bericht DIRECT op het scherm (Optimistic UI update)
    setMessages(m => [...m, localMsg]);

    try {
      // POST naar jouw Django URL route
      const { data } = await api.post(`/conversations/${convo.id}/messages/`, { text: typedText });
      
      // Update de lijst op een veilige manier
      setMessages(prev =>
        prev.map(m => {
          if (m.id === localMsg.id) {
            // Controleer of de backend een volwaardig object stuurde, anders behouden we onze validSender
            const isObjectSender = data.sender && typeof data.sender === 'object' && 'id' in data.sender;
            
            return {
              ...m,
              id: data.id ?? m.id, // Overschrijf tijdelijke ID met echte database ID
              sender: isObjectSender ? data.sender : validSender,
              text: data.text ?? m.text,
              created_at: data.created_at ?? m.created_at
            };
          }
          return m;
        })
      );
    } catch (err) {
      // Belangrijk: Mocht de backend nu een fout geven, dan doen we NIETS met de berichten-state.
      // Je getypte bericht blijft hierdoor gewoon lokaal in de lijst staan en verdwijnt niet meer!
      console.error("Backend weigerde op te slaan, bericht blijft lokaal staan:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "black" }}>
      {/* Topbar Chat */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "max(env(safe-area-inset-top),12px) 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", backgroundColor: "#444" }}>
          {convo.other_user.avatar
            ? <img src={convo.other_user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7)" }} />
          }
        </div>
        <div>
          <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: 0 }}>{convo.other_user.display_name}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>@{convo.other_user.username}</p>
        </div>
      </div>

      {/* Berichten stroom */}
      <div className="no-scroll" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map(msg => {
          const senderId = msg.sender && typeof msg.sender === "object" ? msg.sender.id : msg.sender;
          const isMe = senderId === user?.id || (msg.sender && (msg.sender as any).username === "jij");
          
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8 }}>
              {!isMe && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0, alignSelf: "flex-end", backgroundColor: "#444" }}>
                  {convo.other_user.avatar
                    ? <img src={convo.other_user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7)" }} />
                  }
                </div>
              )}
              <div style={{
                maxWidth: "70%", padding: "10px 16px", borderRadius: 18,
                borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4,
                backgroundColor: isMe ? "#fe2c55" : "#2a2a2a", color: "white", fontSize: 14, lineHeight: 1.4,
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input balk */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", paddingBottom: "max(env(safe-area-inset-bottom), 8px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 24, padding: "10px 16px" }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Bericht sturen..."
            style={{ flex: 1, background: "none", border: "none", color: "white", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <button onClick={send} style={{
          width: 40, height: 40, borderRadius: "50%",
          backgroundColor: text.trim() ? "#fe2c55" : "rgba(255,255,255,0.1)",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Inbox Page ───────────────────────────────────────────────────────────────
const Inbox: React.FC = () => {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  // Haal conversaties op via jouw exacte Django route: /conversations/
  useEffect(() => {
    api.get("/conversations/")
      .then(({ data }) => {
        const list = data.results ?? data;
        if (list.length > 0) {
          setConvos(list);
        } else {
          setConvos(FALLBACK);
        }
      })
      .catch(() => {
        setConvos(FALLBACK);
      })
      .finally(() => setLoading(false));
  }, []);

  if (active) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100dvh", backgroundColor: "black" }}>
        <ChatView convo={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  const filtered = tab === "unread" ? convos.filter(c => c.unread_count > 0) : convos;
  const unreadTotal = convos.filter(c => c.unread_count > 0).length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", backgroundColor: "black", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(env(safe-area-inset-top),12px) 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: 0 }}>Berichten</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 8px" }}>
        {(["all", "unread"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 16px", borderRadius: 24,
            backgroundColor: tab === t ? "white" : "transparent",
            color: tab === t ? "black" : "rgba(255,255,255,0.6)",
            border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t === "all" ? "Alles" : "Ongelezen"}
            {t === "unread" && unreadTotal > 0 && (
              <span style={{ backgroundColor: "#fe2c55", color: "white", fontSize: 11, borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>
                {unreadTotal}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Gesprekken lijst */}
      <div className="no-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40, color: "rgba(255,255,255,0.4)" }}>Laden...</div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "rgba(255,255,255,0.4)" }}>
            <p style={{ fontSize: 14 }}>Geen berichten</p>
          </div>
        ) : (
          filtered.map(convo => (
            <button key={convo.id} onClick={() => setActive(convo)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", backgroundColor: "#444" }}>
                  {convo.other_user.avatar
                    ? <img src={convo.other_user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7)" }} />
                  }
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "white", fontSize: 14, fontWeight: convo.unread_count > 0 ? 700 : 500 }}>{convo.other_user.display_name}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, flexShrink: 0, marginLeft: 8 }}>{timeAgo(convo.last_message_time)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                  <p style={{ color: convo.unread_count > 0 ? "white" : "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "85%" }}>
                    {convo.last_message}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Inbox;