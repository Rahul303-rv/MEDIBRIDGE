"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { User } from "@/types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const explicitlySet = useRef(false);

  useEffect(() => {
    api
      .get("/api/v1/auth/me")
      .then((res) => { if (!explicitlySet.current) setUserState(res.data.user); })
      .catch(() => { if (!explicitlySet.current) setUserState(null); })
      .finally(() => { if (!explicitlySet.current) setLoading(false); });
  }, []);

  const setUser = useCallback((newUser: User | null) => {
    explicitlySet.current = true;
    setUserState(newUser);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    // Clear state first so interceptor redirect doesn't matter
    explicitlySet.current = true;
    setUserState(null);
    try {
      await api.post("/api/v1/auth/logout");
    } catch {}
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
