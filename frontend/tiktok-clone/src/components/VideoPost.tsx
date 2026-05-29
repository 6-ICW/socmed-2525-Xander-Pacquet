import React, { useState, useEffect } from "react";
import { Post } from "../types";
import api from "../api/client"; // Zorg dat de API-client geïmporteerd is

interface VideoPostProps {
  post: Post;
  isActive: boolean;
  onLike?: () => void;
  onBookmark?: () => void;
}

// Interface voor hoe een reactie eruitziet vanuit je Django serializer
interface DBComment {
  id: number;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  };
  text: string;
  created_at: string;
}

const VideoPost: React.FC<VideoPostProps> = ({ post, isActive, onLike, onBookmark }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<DBComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  // 1. Haal de ECHTE reacties op uit de backend zodra het paneel opent
  useEffect(() => {
    if (showComments && post.id < 9000) {
      setLoadingComments(true);
      api.get(`/posts/${post.id}/comments/`) // Dit matcht je Django url: /posts/<pk>/comments/
        .then(({ data }) => {
          // Django REST framework geeft soms data.results terug bij paginering, anders direct de array
          setComments(data.results ?? data);
        })
        .catch(err => console.error("Fout bij laden van reacties:", err))
        .finally(() => setLoadingComments(false));
    } else if (showComments && post.id >= 9000) {
      // Als het een decoy/fallback post is, zetten we er wat nepreacties in
      setComments([
        { id: 1, user: { id: 99, username: "xander", avatar: null }, text: "Vette post! 🔥", created_at: "" },
        { id: 2, user: { id: 91, username: "emma.vdberg", avatar: null }, text: "Prachtig!! ✨", created_at: "" }
      ]);
    }
  }, [showComments, post.id]);

  // 2. Verstuur een ECHTE nieuwe reactie naar de backend
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    // Als het een decoy is, voeg hem puur lokaal in de lijst toe
    if (post.id >= 9000) {
      const mockNew: DBComment = {
        id: Date.now(),
        user: { id: 0, username: "jij", avatar: null },
        text: newCommentText,
        created_at: new Date().toISOString()
      };
      setComments(prev => [...prev, mockNew]);
      setNewCommentText("");
      return;
    }

    try {
      // Stuur de POST-data naar je CommentListCreateView backend
      const { data } = await api.post(`/posts/${post.id}/comments/`, {
        text: newCommentText
      });

      // Voeg de zojuist opgeslagen reactie direct toe aan het scherm
      setComments(prev => [...prev, data]);
      setNewCommentText("");
    } catch (err) {
      console.error("Kon reactie niet plaatsen:", err);
    }
  };

  // STYLING DEFINITIES
  const commentsPanelStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55vh",
    backgroundColor: "#121212",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    display: "flex",
    flexDirection: "column",
    zIndex: 99,
    boxShadow: "0px -4px 20px rgba(0,0,0,0.5)"
  };

  const commentListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    paddingBottom: "140px", 
  };

  const commentInputBarStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "60px", // Staat direct boven je BottomNav navigatiebalk
    left: 0,
    right: 0,
    backgroundColor: "#1e1e1e",
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    zIndex: 100,
  };

  return (
    <div className="video-post-container" style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "black" }}>
      
      {/* 1. HOOFDAFBEELDING */}
      <img src={post.image_url || undefined} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {/* 2. RECHTER ACTIEKNOPPEN */}
      <div style={{ position: "absolute", right: 12, bottom: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid white", overflow: "hidden", marginBottom: 8 }}>
          <img src={post.user.avatar || undefined} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* LIKE (HARTJE) */}
        <button onClick={onLike} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg fill={post.is_liked ? "#fe2c55" : "white"} width="36" height="36" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span style={{ color: "white", fontSize: 13, fontWeight: 600, marginTop: 4 }}>{post.likes_count}</span>
        </button>

        {/* COMMENTS (SPRAAKWOLK) */}
        <button onClick={() => setShowComments(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg fill="white" width="36" height="36" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span style={{ color: "white", fontSize: 13, fontWeight: 600, marginTop: 4 }}>{comments.length}</span>
        </button>

        {/* BOOKMARK (LINTJE) */}
        <button onClick={onBookmark} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg fill={post.is_bookmarked ? "#f7b500" : "white"} width="36" height="36" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span style={{ color: "white", fontSize: 13, fontWeight: 600, marginTop: 4 }}>{post.bookmarks_count}</span>
        </button>
      </div>

      {/* 3. TEKST OVERLAY (ONDERAF) */}
      <div style={{ position: "absolute", left: 12, bottom: 90, right: 80, color: "white", zIndex: 10 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>@{post.user.username}</h4>
        <p style={{ margin: "6px 0 0 0", fontSize: 14 }}>{post.description}</p>
      </div>

      {/* 4. COMMENTS OVERLAY PANEEL */}
      {showComments && (
        <div style={commentsPanelStyle}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width: 24 }} />
            <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{comments.length} reacties</span>
            <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>

          {/* Scrollbare lijst met echte database-reacties */}
          <div style={commentListStyle}>
            {loadingComments ? (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginTop: 20 }}>Reacties laden...</p>
            ) : comments.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", marginTop: 20 }}>Plaats de eerste reactie!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#fe2c55", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 600 }}>
                      {c.user.username ? c.user.username[0].toUpperCase() : "U"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>
                        {c.user.username}
                      </span>
                      <span style={{ color: "white", fontSize: 14 }}>{c.text}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FORMULIER/INPUTBAR BOVEN DE NAVIGATIE */}
          <form onSubmit={handlePostComment} style={commentInputBarStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input 
                type="text" 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Voeg een reactie toe..." 
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 16px",
                  color: "white",
                  fontSize: 14,
                  outline: "none"
                }}
              />
              <button type="submit" style={{ color: "#fe2c55", background: "none", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Plaats
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default VideoPost;