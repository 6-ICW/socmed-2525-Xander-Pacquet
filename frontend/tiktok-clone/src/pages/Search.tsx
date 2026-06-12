// React importeren en de benodigde hooks
import React, { useState } from "react";

// Het Post type importeren zodat TypeScript weet hoe een post eruitziet
import { Post } from "../types";

// De axios instantie importeren om API-calls te maken
import api from "../api/client";

// De onderste navigatiebalk importeren
import BottomNav from "../components/BottemNav";

// useNavigate importeren om programmatisch te navigeren
import { useNavigate } from "react-router-dom";

// De Search component definiëren als een functionele React component
const Search: React.FC = () => {

  // Hook om te navigeren naar andere pagina's
  const navigate = useNavigate();

  // State voor de zoekterm die de gebruiker intypt
  const [query, setQuery] = useState("");

  // State voor de lijst van gevonden posts
  const [results, setResults] = useState<Post[]>([]);

  // State om bij te houden of er momenteel geladen wordt
  const [loading, setLoading] = useState(false);

  // State om bij te houden of er al gezocht is (voor de "geen resultaten" melding)
  const [searched, setSearched] = useState(false);

  // Functie die de zoekopdracht uitvoert
  const doSearch = async (q: string) => {

    // Als de zoekterm leeg is, niets doen
    if (!q.trim()) return;

    // Laadstatus aanzetten
    setLoading(true);

    // Aangeven dat er gezocht is
    setSearched(true);

    try {
      // API-call naar de backend met de zoekterm als query parameter
      const { data } = await api.get(`/posts/search/?q=${encodeURIComponent(q)}`);

      // Resultaten opslaan in state (data.results voor gepagineerde responses, anders data zelf)
      setResults(data.results ?? data);

    } catch {
      // Bij een fout de resultatenlijst leegmaken
      setResults([]);

    } finally {
      // Laadstatus altijd uitzetten, ook bij een fout
      setLoading(false);
    }
  };

  return (
    // Buitenste container met zwarte achtergrond die de volledige schermhoogte vult
    <div style={{ backgroundColor: "black", minHeight: "100dvh", color: "white" }}>

      {/* Zoekbalk die bovenaan blijft plakken bij het scrollen */}
      <div style={{ padding: "60px 16px 12px", position: "sticky", top: 0, backgroundColor: "black", zIndex: 10 }}>

        {/* Terugknop om naar de vorige pagina te gaan */}
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          color: "white", fontSize: 15, marginBottom: 12, padding: 0,
        }}>
          {/* Pijl-icoon naar links */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Terug
        </button>

        {/* Rij met het zoekveld en de zoekknop */}
        <div style={{ display: "flex", gap: 8 }}>

          {/* Tekstinvoerveld voor de zoekterm */}
          <input
            type="text"
            value={query}
            // Query state updaten bij elke toetsaanslag
            onChange={e => setQuery(e.target.value)}
            // Zoeken bij het indrukken van Enter
            onKeyDown={e => e.key === "Enter" && doSearch(query)}
            placeholder="Zoeken..."
            style={{
              flex: 1, backgroundColor: "#1c1c1c", border: "none",
              borderRadius: 8, padding: "10px 14px", color: "white",
              fontSize: 15, outline: "none",
            }}
          />

          {/* Zoekknop die de zoekopdracht triggert */}
          <button
            onClick={() => doSearch(query)}
            style={{
              backgroundColor: "#fe2c55", border: "none", borderRadius: 8,
              padding: "10px 18px", color: "white", fontWeight: 600,
              fontSize: 15, cursor: "pointer",
            }}
          >
            Zoek
          </button>
        </div>
      </div>

      {/* Resultatengedeelte met padding aan de onderkant voor de navigatiebalk */}
      <div style={{ padding: "12px 16px 80px" }}>

        {/* Laadspinner tonen zolang de API-call bezig is */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            {/* Roterende cirkel als laadanimatie */}
            <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#fe2c55", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {/* Melding tonen als er gezocht is maar geen resultaten gevonden zijn */}
        {!loading && searched && results.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 40 }}>
            Geen resultaten voor "{query}"
          </p>
        )}

        {/* Lijst van gevonden posts tonen */}
        {!loading && results.map(post => (

          // Elke rij is klikbaar en navigeert naar het profiel van de gebruiker
          <div key={post.id} onClick={() => navigate(`/profile/${post.user.id}`)} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", cursor: "pointer" }}>

            {/* Thumbnail van de post */}
            <img
              src={post.image_url}
              alt=""
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
            />

            {/* Tekstgedeelte naast de thumbnail */}
            <div>
              {/* Gebruikersnaam van de poster */}
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>@{post.user.username}</p>

              {/* Beschrijving van de post, afgeknipt na 2 regels */}
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {post.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Onderste navigatiebalk */}
      <BottomNav />
    </div>
  );
};

// De component exporteren zodat hij in andere bestanden gebruikt kan worden
export default Search;