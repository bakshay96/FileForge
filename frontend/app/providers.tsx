"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { AuthContext, User } from "@/lib/auth";

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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
