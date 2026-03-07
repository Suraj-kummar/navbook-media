'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management helpers
function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = getAuthToken();
        if (storedToken) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(`${apiUrl}/auth/me?token=${encodeURIComponent(storedToken)}`);
          if (response.ok) {
            setIsAuthenticated(true);
            setToken(storedToken);
          } else {
            clearAuthToken();
            setIsAuthenticated(false);
            setToken(null);
          }
        } else {
          setIsAuthenticated(false);
          setToken(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await response.json();
      const newToken = data.access_token;
      setAuthToken(newToken);
      setToken(newToken);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const currentToken = getAuthToken();
      if (currentToken) {
        await fetch(`${apiUrl}/auth/logout?token=${encodeURIComponent(currentToken)}`, {
          method: 'POST',
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthToken();
      setIsAuthenticated(false);
      setToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, error, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
