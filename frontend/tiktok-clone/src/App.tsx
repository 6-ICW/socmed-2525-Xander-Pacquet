import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "./api/client";
import { AuthUser } from "./types";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Inbox from "./pages/Inbox";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload"
import Search from "./pages/Search";
import ForgotPassword from "./pages/ForgotPassword";

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const { data } = await api.get("/auth/me/");
        setUser(data);
      } catch {
        localStorage.clear();
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/token/", { username, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    const me = await api.get("/auth/me/");
    setUser(me.data);
  };

  const register = async (username: string, email: string, password: string) => {
    await api.post("/auth/register/", { username, email, password });
    await login(username, password);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me/");
      setUser(data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Protected Route ──────────────────────────────────────────────────────────

const Protected = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: "100dvh", width: "100%", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "#fe2c55", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/inbox" element={<Protected><Inbox /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/profile/:userId" element={<Protected><Profile /></Protected>} />
        <Route path="/upload" element={<Protected><Upload /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/search" element={<Protected><Search /></Protected>} />    
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;

// binnen <Routes>: