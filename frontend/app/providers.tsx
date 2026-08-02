"use client";

import React, { useEffect, useState, useContext, createContext, useCallback } from "react";
import api from "@/lib/api";
import { AuthContext, User } from "@/lib/auth";

/* ══════════════════════════════════════════════
   THEME CONTEXT
══════════════════════════════════════════════ */
type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("ff_theme") as Theme | null;
    const initial = stored ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("ff_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ══════════════════════════════════════════════
   AUTH PROVIDER
══════════════════════════════════════════════ */
export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem("ff_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<User>("/api/auth/me");
        setUser(data);
      } catch (err) {
        console.error("Failed to load user:", err);
        localStorage.removeItem("ff_token");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data } = await api.post<{ access_token: string; user_id: string; email: string; name: string }>(
      "/api/auth/login",
      { email, password: pass }
    );
    localStorage.setItem("ff_token", data.access_token);
    setUser({ user_id: data.user_id, email: data.email, name: data.name });
  };

  const register = async (name: string, email: string, pass: string) => {
    const { data } = await api.post<{ access_token: string; user_id: string; email: string; name: string }>(
      "/api/auth/register",
      { name, email, password: pass }
    );
    localStorage.setItem("ff_token", data.access_token);
    setUser({ user_id: data.user_id, email: data.email, name: data.name });
  };

  const logout = () => {
    localStorage.removeItem("ff_token");
    setUser(null);
  };

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, loading, login, register, logout }}>
        {children}
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
