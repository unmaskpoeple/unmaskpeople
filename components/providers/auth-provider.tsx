"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "DISABLED" | "SUSPENDED";
  emailVerified: boolean;
  walletBalance: number;
  currency: string;
  createdAt: string;
  referralCode?: string | null;
  successfulSearchCount?: number;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (userData: any) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateBalanceLocally: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateBalanceLocally: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (userData: any) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch {
      setUser(null);
      router.push("/login");
    }
  };

  const updateBalanceLocally = (newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, walletBalance: newBalance } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        updateBalanceLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
