'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as auth from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return auth.isAuthenticated();
  });
  const [user, setUser] = useState<{ username: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    return auth.getUser();
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async (username: string, password: string) => {
    try {
      await auth.login(username, password);
      const savedUser = auth.getUser();
      setIsAuthenticated(true);
      setUser(savedUser);
      router.push('/to-go/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/to-go/admin');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
