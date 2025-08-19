'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Employee } from '@/lib/types';
import { employees } from '@/lib/data'; // In a real app, this would be an API call

interface AuthContextType {
  user: Employee | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'timewise-auth-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    // This is a mock authentication. In a real app, you'd make an API call.
    const foundUser = employees.find(
      (emp) => emp.name.toLowerCase() === username.toLowerCase() && emp.password === password
    );

    if (foundUser) {
      const { password, ...userToStore } = foundUser;
      setUser(userToStore as Employee);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToStore));
      setLoading(false);
      return true;
    } else {
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
