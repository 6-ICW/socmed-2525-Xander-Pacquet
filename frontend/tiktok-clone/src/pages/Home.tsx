import React, { useState, useEffect, useRef } from "react";
import { Post } from "../types";
import api from "../api/client";
import VideoPost from "../components/VideoPost";
import BottomNav from "../components/BottemNav";
import { useAuth } from "../App"; // <-- Cruciaal om currentUser te kunnen gebruiken!
import { useNavigate } from "react-router-dom";


type Tab = "following" | "foryou" | "explore";

// De FALLBACK lijst met unieke hoge IDs zodat ze niet botsen met de database
const FALLBACK: Post[] = [
  {
    id: 9901,
    user: { id: 991, username: "emma.vdberg", display_name: "Emma", avatar: "https://i.pravatar.cc/150?img=1", is_verified: true, followers_count: 2400000, following_count: 312, likes_count: 48200000, bio: "", posts_count: 89 },
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    description: "Zonsopgang in de bergen was absoluut magisch 🌅✨",
    music: "Golden Hour", music_artist: "JVKE",
    likes_count: 284700, comments_count: 0, shares_count: 12400, bookmarks_count: 89200,
    is_liked: false, is_bookmarked: false, is_following: false,
    hashtags: ["bergen", "natuur", "foryou"], created_at: new Date().toISOString(),
  },
  {
    id: 9902,
    user: { id: 992, username: "foodie.nathalie", display_name: "Nathalie", avatar: "https://i.pravatar.cc/150?img=5", is_verified: true, followers_count: 5100000, following_count: 203, likes_count: 92000000, bio: "", posts_count: 234 },
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
    description: "Mijn favoriete pasta recept 🍝 Probeer het thuis!",
    music: "Cooking Vibes", music_artist: "Lofi Studio",
    likes_count: 1240000, comments_count: 0, shares_count: 234000, bookmarks_count: 445000,
    is_liked: false, is_bookmarked: false, is_following: false,
    hashtags: ["koken", "pasta", "food", "fyp"], created_at: new Date().toISOString(),
  },
  {
    id: 9903,
    user: { id: 993, username: "travelwith.sara", display_name: "Sara", avatar: "https://i.pravatar.cc/150?img=9", is_verified: true, followers_count: 12800000, following_count: 89, likes_count: 340000000, bio: "", posts_count: 512 },
    image_url: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600&q=80",
    description: "Tokyo bij nacht is een andere wereld 🌌",
    music: "Night Drive", music_artist: "RetroWave",
    likes_count: 3890000, comments_count: 0, shares_count: 892000, bookmarks_count: 1200000,
    is_liked: false, is_bookmarked: false, is_following: false,
    hashtags: ["tokyo", "japan", "travel", "fyp"], created_at: new Date().toISOString(),
  },
];

const Home: React.FC = () => {
  const { user: currentUser } = useAuth(); // <-- Fix voor de 'Cannot find name currentUser' fout!
  const [tab, setTab] = useState<Tab>("foryou");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navigate = useNavigate();

  const loadPosts = (t: Tab) => {
    setLoading(true);
    setActiveIndex(0);
    const url = t === "following" ? "/posts/following/" : "/posts/feed/";
    
    api.get(url)
      .then(({ data }) => {
        let results = data.results ?? data;

        // Filter jouw eigen hondenposts eruit op 'Voor jou'
        if (t !== "following" && currentUser) {
          results = results.filter((post: Post) => post.user.id !== currentUser.id);
        }

        // Voeg de nep-accounts toe als we niet op de 'Volgend' tab zitten
        if (t !== "following") {
          setPosts([...results, ...FALLBACK]);
        } else {
          setPosts(results);
        }
      })
      .catch((err) => {
        console.error("Fout bij het laden van posts:", err);
        if (t !== "following") {
          setPosts(FALLBACK);
        } else {
          setPosts([]);
        }
      })
      .finally(() => setLoading(false));
  };

  // Zorgt ervoor dat je decoys lokaal kunt liken zonder serverfouten!
  const handleLikeToggle = async (postId: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isLiked = !post.is_liked;
          return {
            ...post,
            is_liked: isLiked,
            likes_count: isLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1)
          };
        }
        return post;
      })
    );

    if (postId < 9000) {
      try {
        await api.post(`/posts/${postId}/like/`);
      } catch (err) {
        console.error("Backend like fout:", err);
      }
    }
  };

  // Zorgt ervoor dat je decoys lokaal kunt bookmarken
  const handleBookmarkToggle = async (postId: number) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isBookmarked = !post.is_bookmarked;
          return {
            ...post,
            is_bookmarked: isBookmarked,
            bookmarks_count: isBookmarked ? post.bookmarks_count + 1 : Math.max(0, post.bookmarks_count - 1)
          };
        }
        return post;
      })
    );

    if (postId < 9000) {
      try {
        await api.post(`/posts/${postId}/bookmark/`);
      } catch (err) {
        console.error("Backend bookmark fout:", err);
      }
    }
  };

  useEffect(() => {
    loadPosts(tab);
  }, [tab]);

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const i = itemRefs.current.findIndex(r => r === e.target);
            if (i !== -1) setActiveIndex(i);
          }
        });
      },
      { threshold: 0.6, root: containerRef.current }
    );
    itemRefs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [posts]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", backgroundColor: "black", overflow: "hidden" }}>

      {/* Bovenbalk navigatie */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: "max(env(safe-area-inset-top), 12px)",
        paddingBottom: 8, paddingLeft: 16, paddingRight: 16,
      }}>
        <button style={{
          position: "absolute", left: 16, top: "max(env(safe-area-inset-top), 12px)",
          background: "none", border: "1px solid rgba(255,255,255,0.8)", borderRadius: 4, padding: "2px 6px",
        }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>LIVE</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {(["following", "foryou", "explore"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              position: "relative", background: "none", border: "none", cursor: "pointer",
              color: tab === t ? "white" : "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: tab === t ? 700 : 500,
            }}>
              {t === "following" ? "Volgend" : t === "foryou" ? "Voor jou" : "Ontdekken"}
              {tab === t && <span style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, backgroundColor: "white" }} />}
            </button>
          ))}
        </div>
        <button onClick={() => navigate("/search")} style={{
          position: "absolute", right: 16,
          top: "max(env(safe-area-inset-top), 12px)",
          background: "none", border: "none", cursor: "pointer",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>

      {/* Feed overzicht */}
      {loading ? (
        <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "#fe2c55", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Geen posts gevonden</p>
        </div>
      ) : (
        <div ref={containerRef} className="feed-container">
          {posts.map((post, i) => (
            <div key={i} ref={el => { itemRefs.current[i] = el; }} className="feed-item">
              <VideoPost 
                post={post} 
                isActive={i === activeIndex} 
                onLike={() => handleLikeToggle(post.id)}
                onBookmark={() => handleBookmarkToggle(post.id)}
              />
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Home;