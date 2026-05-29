import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    {
      key: "/",
      label: "Home",
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24"
          fill={active ? "white" : "none"}
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      key: "/friends",
      label: "Vrienden",
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke={active ? "white" : "rgba(255,255,255,0.6)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      key: "upload",
      label: "",
      icon: () => null,
    },
    {
      key: "/inbox",
      label: "Inbox",
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke={active ? "white" : "rgba(255,255,255,0.6)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      key: "/profile",
      label: "Profiel",
      icon: (active: boolean) => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke={active ? "white" : "rgba(255,255,255,0.6)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      zIndex: 50, display: "flex", alignItems: "center",
      justifyContent: "space-around",
      padding: "8px 8px max(env(safe-area-inset-bottom), 8px)",
      backgroundColor: "black",
      borderTop: "1px solid rgba(255,255,255,0.1)",
    }}>
      {tabs.map((tab) => {
        if (tab.key === "upload") {
          return (
            <button
              key="upload"
              onClick={() => navigate("/upload")}
              style={{
                background: "none", border: "none",
                cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                minWidth: 50,
              }}
            >
              <div style={{ position: "relative", width: 44, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", left: 0, width: 36, height: 26, backgroundColor: "#69c9d0", borderRadius: 6 }} />
                <div style={{ position: "absolute", right: 0, width: 36, height: 26, backgroundColor: "#fe2c55", borderRadius: 6 }} />
                <div style={{
                  position: "absolute", left: "50%", transform: "translateX(-50%)",
                  width: 36, height: 26, backgroundColor: "white", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#161823" strokeWidth="3" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              </div>
            </button>
          );
        }

        const active = pathname === tab.key ||
          (tab.key === "/profile" && pathname.startsWith("/profile"));

        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, minWidth: 50, padding: 0, fontFamily: "inherit",
            }}
          >
            {tab.icon(active)}
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: active ? "white" : "rgba(255,255,255,0.6)",
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;