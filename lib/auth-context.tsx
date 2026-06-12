'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User { id: string; username: string; is_admin: boolean; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<{ error?: string }>;
  register: (u: string, p: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem('wc_user');
    if (s) try { setUser(JSON.parse(s)); } catch {}
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const d = await r.json();
    if (d.error) return { error: d.error };
    setUser(d.user);
    localStorage.setItem('wc_user', JSON.stringify(d.user));
    localStorage.setItem('wc_session', username);
    return {};
  };

  const register = async (username: string, password: string) => {
    const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const d = await r.json();
    if (d.error) return { error: d.error };
    setUser(d.user);
    localStorage.setItem('wc_user', JSON.stringify(d.user));
    localStorage.setItem('wc_session', username);
    return {};
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wc_user');
    localStorage.removeItem('wc_session');
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
};
