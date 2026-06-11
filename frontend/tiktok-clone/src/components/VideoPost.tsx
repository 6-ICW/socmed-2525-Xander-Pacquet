import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Post } from "../types";
import api from "../api/client";
import { useAuth } from "../App";

interface Props {
  post: Post;
  isActive: boolean;
}

//Functie die grote getallen omzet naar een kort formaat (bijv. 1200 -> 1.2K)
const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" :
  n >= 1_000 ? (n / 1_000).toFixed(1) + "K" : String(n);

// Functie die een ISO-datum omzet naar een relatieve tijd (bijv. 5m, 2u, 3d)
const timeAgo = (iso: string) => {
  //berekening sec
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}u`;
  return `${Math.floor(s / 86400)}d`;
};

// ─── Comments Drawer ──────────────────────────────────────────────────────────
// Definieert een React Function Component met inline types voor de props
const CommentsDrawer: React.FC<{
  // ID van de post waarvoor reacties worden opgehaald
  postId: number;
  // Huidig aantal reacties op de post
  count: number;
   // Functie om de comments drawer te sluiten
  onClose: () => void;
  // Functie om het aantal reacties in de parent component bij te werken
  onCountChange: (n: number) => void;
  // Destructureert de props zodat ze direct gebruikt kunnen worden
}> = ({ postId, count, onClose, onCountChange }) => {
  // Haalt de ingelogde gebruiker op uit de authenticatiecontext
  const { user } = useAuth();
  // State waarin alle reacties worden opgeslagen
  const [comments, setComments] = useState<any[]>([]);
  // State voor de huidige tekst in het invoerveld
  const [text, setText] = useState("");
  // State die aangeeft of reacties nog geladen worden
  const [loading, setLoading] = useState(true);
   // Houdt per reactie bij of de gebruiker deze geliket heeft
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  // Houdt per reactie het aantal likes bij
  const [likesMap, setLikesMap] = useState<Record<number, number>>({});
  // Referentie naar het inputveld zodat we het kunnen focussen
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect dat wordt uitgevoerd wanneer postId verandert
  React.useEffect(() => {
    setLoading(true);
    // Haalt alle reacties op voor de geselecteerde post
    api.get(`/posts/${postId}/comments/`)
    // Verwerkt de ontvangen data
      .then(({ data }) => {
        // Ondersteunt zowel paginated als niet-paginated responses
        const list = data.results ?? data;
        setComments(list);
      })
      //negeert fouten bij het ophalen
      .catch(() => {})
      // Wordt altijd uitgevoerd, ongeacht succes of fout
      .finally(() => setLoading(false));
      // Effect wordt opnieuw uitgevoerd als postId verandert
  }, [postId]);

  // Effect dat slechts één keer draait bij het openen van de drawer
  React.useEffect(() => {
    // Wacht 350ms en zet vervolgens de focus op het invoerveld
    setTimeout(() => inputRef.current?.focus(), 350);
  // Lege dependency-array = alleen bij mount uitvoeren
  }, []);



  // Functie om een nieuwe reactie te plaatsen
  const submit = async () => {
    // Stop als het invoerveld leeg is of alleen spaties bevat
    if (!text.trim()) return;
    // Slaat de huidige tekst tijdelijk op
    const draft = text.trim();
    // Maakt het invoerveld direct leeg voor een snellere UX
    setText("");
    try {
      // Stuurt de nieuwe reactie naar de backend
      const { data } = await api.post(
        `/posts/${postId}/comments/`,
        { text: draft }
      );
      // Voegt de nieuwe reactie bovenaan de lijst toe
      setComments(c => [data, ...c]);
      // Verhoogt het reactieaantal in de parent component
      onCountChange(count + 1);
    } catch (err: any) {
      // Bij een fout wordt de tekst teruggezet in het invoerveld
      setText(draft);
    }
  };

  // Functie om like/unlike status van een comment te togglen
  const toggleLike = async (
    id: number, // ID van de comment
    currentLiked: boolean, // Huidige like-status van de gebruiker voor deze comment
    currentCount: number  // Huidig aantal likes
  ) => { 
     // Optimistische update: direct UI updaten alsof de like is aangepast
    setLikedMap(m => ({ ...m, [id]: !currentLiked })); //flip de like status
    setLikesMap(m => ({ ...m, [id]: currentCount + (currentLiked ? -1 : 1) })); //+1 bij like, -1 bij unlike
    try {
      // Verstuur request naar backend om like te togglen
      await api.post(`/posts/comments/${id}/like/`);
    } catch {
      // Bij fout: herstel originele like-status
      setLikedMap(m => ({ ...m, [id]: currentLiked }));
      // Bij fout: herstel originele like-count
      setLikesMap(m => ({ ...m, [id]: currentCount }));
    }
  };

  return (
    // Overlay container (donkere achtergrond over de app)
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose} // Klik buiten drawer sluit comments
    >
      {/* Comments drawer container */}
      <div
        className="rounded-t-2xl flex flex-col slide-up"
        style={{ height: "60dvh", backgroundColor: "#1c1c1c", maxHeight: "60dvh" }} // 60vdh => 60% van viewport height (mobile-friendly)
        onClick={e => e.stopPropagation()} // Klik binnen drawer sluit NIET
      >
         {/* Drag indicator (balkje bovenaan) */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* Header: aantal reacties + close button */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 6px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          {/* Reactie count */}
          <span style={{ color: "white", fontWeight: 600, fontSize: 16 }}>{fmt(count)} reacties</span>
           {/* Sluit knop */}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            {/* X icoon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Scrollbare comments lijst */}
        <div className="no-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
           {/* Loading state */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
            // Geen comments state
          ) : comments.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", marginTop: 32 }}>
              Wees de eerste om te reageren
            </p>
            // Comments lijst
          ) : (
            comments.map((c: any) => {
               // Bepaal of deze comment geliked is (optimistic of server state)
              const isLiked = likedMap[c.id] ?? c.is_liked;
              // Bepaal aantal likes (optimistic of server state)
              const likesCount = likesMap[c.id] ?? c.likes_count;
              return (
                // Comment row container
                <div key={c.id} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, backgroundColor: "#444" }}>
                    {/* User avatar of fallback gradient */}
                    {c.user?.avatar
                      ? <img src={c.user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7)" }} />
                    }
                  </div>
                  {/* Comment content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Username + timestamp */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{c.user?.username}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{timeAgo(c.created_at)}</span>
                    </div>
                    {/* Comment text */}
                    <p style={{ color: "white", fontSize: 13, marginTop: 2, lineHeight: 1.4 }}>{c.text}</p>
                     {/* Reply knop indien replies bestaan */}
                    {c.reply_count > 0 && (
                      <button style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>
                        {c.reply_count} antwoorden bekijken
                      </button>
                    )}
                  </div>
                   {/* Like knop */}
                  <button
                    onClick={() => toggleLike(c.id, isLiked, likesCount)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}
                  >
                    {/* Hart icoon */}
                    <svg width="16" height="16" viewBox="0 0 24 24"
                      fill={isLiked ? "#fe2c55" : "none"}
                      stroke={isLiked ? "#fe2c55" : "white"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {/* Like count */}
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{fmt(likesCount)}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
        {/* Container van de comment input bar onderaan de comments drawer*/}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px",
           // veilige padding voor iPhones met home indicator (safe area)
          paddingBottom: "max(env(safe-area-inset-bottom), 10px)", 
          borderTop: "1px solid rgba(255,255,255,0.1)", // subtiele scheidingslijn boven input
          backgroundColor: "#1c1c1c", // donkere achtergrond zoals de drawer
        }}>
          {/* Avatar container van de gebruiker */}
          <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, backgroundColor: "#444" }}>
            {/* Toon avatar als die bestaat, anders gradient placeholder */}
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7)" }} />
            }
          </div>
          {/* Input veld voor nieuwe reactie */}
          <input
            ref={inputRef} // auto-focus referentie
            value={text}   // controlled input waarde
            onChange={e => setText(e.target.value)}  // update state bij typen
            onKeyDown={e => e.key === "Enter" && submit()} // verstuur reactie bij Enter toets
            placeholder="Voeg een reactie toe..." // placeholder tekst
            style={{
              flex: 1, backgroundColor: "rgba(255,255,255,0.1)", border: "none", borderRadius: 24,
              padding: "10px 16px", color: "white", fontSize: 13, outline: "none",
              fontFamily: "inherit",
            }}
          />
           {/* Verstuur knop */}
          <button
            onClick={submit}
            disabled={!text.trim()}  // uitgeschakeld als input leeg is
            style={{
              background: "none", border: "none", cursor: text.trim() ? "pointer" : "default",
              color: text.trim() ? "#fe2c55" : "rgba(255,255,255,0.3)",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit", flexShrink: 0,  // 0 voorkomt dat knop samendrukt
            }}
          >
            Plaatsen
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Share Drawer ─────────────────────────────────────────────────────────────
// React component voor het share/delen menu van een post
const ShareDrawer: React.FC<{ postId: number; onClose: () => void }> = ({ postId, onClose }) => {
  // Functie die de link naar de post kopieert naar het klembord
  const handleCopy = () => {
    // Bouwt de volledige URL naar de post
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    onClose();
  };

  return (
    // Overlay (donkere achtergrond over de app)
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end fade-in"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      {/* Share drawer container */}
      <div
        className="slide-up"
        style={{ backgroundColor: "#1c1c1c", borderRadius: "16px 16px 0 0", paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag indicator balkje */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
        </div>
        {/* Titel van de drawer */}
        <p style={{ color: "white", fontWeight: 600, fontSize: 16, textAlign: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Delen</p>
         {/* Horizontale scrollbare share opties */}
        <div className="no-scroll" style={{ display: "flex", gap: 16, padding: "16px 20px", overflowX: "auto" }}>
          {/* Emoji share shortcuts (placeholder UI opties) */}
          {["💬", "📱", "📧", "📲", "🔗"].map((icon, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
               {/* ronde knop met emoji */}
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{icon}</div>
               {/* label onder icon */}
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Optie {i + 1}</span>
            </div>
          ))}
        </div>
          {/* Actie lijst (echte share functies) */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { icon: "🔗", label: "Link kopiëren", action: handleCopy },
            { icon: "📤", label: "Delen via...", action: onClose },
            { icon: "📸", label: "Opslaan als afbeelding", action: onClose },
            { icon: "🚫", label: "Niet interessant", action: onClose },
          ].map((opt, i) => (
            <button key={i} onClick={opt.action} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 16,
              padding: "14px 20px", background: "none", border: "none",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {/* icon links */}
              <span style={{ fontSize: 20 }}>{opt.icon}</span>
              {/* tekst label */}
              <span style={{ color: "white", fontSize: 14 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── VideoPost ────────────────────────────────────────────────────────────────
// React component die een video-post rendert
const VideoPost: React.FC<Props> = ({ post, isActive }) => {
  // Hook om te navigeren naar andere routes (bijv. profielpagina)
  const navigate = useNavigate(); // ← NIEUW: voor navigatie naar profiel

  const [liked, setLiked]                     = useState(post.is_liked);        // State: of de post geliked is
  const [likesCount, setLikesCount]           = useState(post.likes_count);     // State: aantal likes op de post
  const [bookmarked, setBookmarked]           = useState(post.is_bookmarked);   // State: of de post gebookmarked is
  const [bookmarksCount, setBookmarksCount]   = useState(post.bookmarks_count); // State: aantal bookmarks
  const [following, setFollowing]             = useState(post.is_following);    // State: of de huidige user de eigenaar volgt
  const [commentsCount, setCommentsCount]     = useState(post.comments_count);  // State: aantal comments
  const [likeAnim, setLikeAnim]               = useState(false);                // State: animatie trigger voor like effect
  const [showComments, setShowComments]       = useState(false);                // State: of comments drawer zichtbaar is
  const [showShare, setShowShare]             = useState(false);                // State: of share drawer zichtbaar is
  const [tapHeart, setTapHeart]               = useState<{ x: number; y: number } | null>(null); // State: positie van hart-animatie bij double tap
  const lastTap = useRef(0); // Ref: houdt timestamp bij van laatste tap (voor double tap detectie)
  const likeInFlight = useRef(false); // Ref: voorkomt meerdere like requests tegelijk

  // ← NIEUW: navigeer naar het profiel van de maker van de post
  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation(); // voorkomt dat de double-tap ook afgaat
    navigate(`/profile/${post.user.id}`);
  };

  const handleTap = (e: React.MouseEvent) => {
    // Huidige timestamp
    const now = Date.now();
     // Check of dit een double tap is (binnen 300ms)
    if (now - lastTap.current < 300) {
      // Berekent positie van tap binnen element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      // Zet hart-animatie positie (voor floating heart effect)
      setTapHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      // Alleen liken als nog niet geliked en geen request bezig is
      if (!liked && !likeInFlight.current) {
        // Zet request lock aan
        likeInFlight.current = true;
         // Optimistic UI update: meteen like zetten
        setLiked(true);
        setLikesCount(c => c + 1);
         // API call om like op server te registreren
        api.post(`/posts/${post.id}/like/`)
          .catch(() => { setLiked(false); setLikesCount(c => c - 1); })
          .finally(() => { likeInFlight.current = false; });
      }
      // Verwijder hart animatie na 800ms
      setTimeout(() => setTapHeart(null), 800);
    }
    lastTap.current = now;
  };

  const toggleLike = (e: React.MouseEvent) => {
    // voorkomt bubbling naar video click
    e.stopPropagation();
    // als request bezig is, stop
    if (likeInFlight.current) return;
    // lock request
    likeInFlight.current = true;
    // bereken nieuwe state
    const next = !liked;
    // optimistic update UI
    setLiked(next);
    setLikesCount(c => c + (next ? 1 : -1));
    //start animatie
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 350);
    // API call
    api.post(`/posts/${post.id}/like/`)
      .catch(() => {
        // rollback bij fout
        setLiked(!next);
        setLikesCount(c => c + (next ? -1 : 1));
      })
      // unlock
      .finally(() => { likeInFlight.current = false; });
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    // nieuwe bookmark state
    const next = !bookmarked;
    // optimistic update
    setBookmarked(next);
    setBookmarksCount(c => c + (next ? 1 : -1));
    // API call
    api.post(`/posts/${post.id}/bookmark/`).catch(() => {
      // rollback bij fout
      setBookmarked(!next);
      setBookmarksCount(c => c + (next ? -1 : 1));
    });
  };

  const toggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !following;
    setFollowing(next);
    api.post(`/users/${post.user.id}/follow/`).catch(() => setFollowing(!next));
  };

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "black" }}
      onClick={handleTap}
    >
      {/* Foto */}
      <img
        src={post.image_url}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        draggable={false}
      />

      {/* Gradient */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)"
      }} />

      {/* Double tap hart */}
      {tapHeart && (
        <div className="heart-pop" style={{
          position: "absolute", left: tapHeart.x, top: tapHeart.y,
          pointerEvents: "none", zIndex: 50,
          transform: "translate(-50%, -50%)",
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#fe2c55">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      )}

      {/* Rechtse sidebar */}
      <div style={{
        position: "absolute", right: 12, bottom: 96,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 20,
      }}>
        {/* Avatar — klikbaar naar profiel */}
        <div style={{ position: "relative" }}>
          <div
            onClick={goToProfile} // ← NIEUW: klik op avatar → naar profiel
            style={{ width: 48, height: 48, borderRadius: "50%", border: "2.5px solid white", overflow: "hidden", backgroundColor: "#444", cursor: "pointer" }}
          >
            {post.user.avatar
              ? <img src={post.user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f472b6, #a855f7)" }} />
            }
          </div>
          {!following && (
            <button onClick={toggleFollow} style={{
              position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
              width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fe2c55",
              border: "2px solid black", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <line x1="4.5" y1="1" x2="4.5" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="1" y1="4.5" x2="8" y2="4.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Like knop */}
        <button onClick={toggleLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: likeAnim ? "scale(1.3)" : "scale(1)", transition: "transform 0.2s",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24"
              fill={liked ? "#fe2c55" : "white"} stroke={liked ? "#fe2c55" : "white"} strokeWidth="0.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>{fmt(likesCount)}</span>
        </button>

        {/* Reacties knop */}
        <button
          onClick={e => { e.stopPropagation(); setShowComments(true); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>{fmt(commentsCount)}</span>
        </button>

        {/* Bookmark knop */}
        <button onClick={toggleBookmark}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24"
              fill={bookmarked ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>{fmt(bookmarksCount)}</span>
        </button>

        {/* Delen knop */}
        <button onClick={e => { e.stopPropagation(); setShowShare(true); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
          <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>{fmt(post.shares_count)}</span>
        </button>

        {/* Muziekschijf */}
        <div className={isActive ? "disc-spin" : ""} style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #444", overflow: "hidden", position: "relative",
        }}>
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #333, #111)" }}>
            {post.user.avatar && <img src={post.user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />}
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#111", border: "1px solid #444" }} />
          </div>
        </div>
      </div>

      {/* Onderste info */}
      <div style={{ position: "absolute", bottom: 80, left: 16, right: 80, zIndex: 20 }}>
        {/* Gebruikersnaam — klikbaar naar profiel */}
        <p
          onClick={goToProfile} // ← NIEUW: klik op naam → naar profiel
          style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 4, cursor: "pointer" }}
        >
          @{post.user.username}
        </p>
        <p style={{ color: "white", fontSize: 13, lineHeight: 1.4, marginBottom: 8 }}>
          {post.description}{" "}
          {post.hashtags.map(tag => (
            <span key={tag} style={{ fontWeight: 600 }}>#{tag} </span>
          ))}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="marquee" style={{ color: "white", fontSize: 12 }}>
              {post.music} - {post.music_artist}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{post.music} - {post.music_artist}
            </div>
          </div>
        </div>
      </div>

      {/* Drawers */}
      {showComments && (
        <CommentsDrawer
          postId={post.id}
          count={commentsCount}
          onClose={() => setShowComments(false)}
          onCountChange={setCommentsCount}
        />
      )}
      {showShare && (
        <ShareDrawer postId={post.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

export default VideoPost;