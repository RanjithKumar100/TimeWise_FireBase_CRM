'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Employee, UserRole } from '@/lib/types';
import { isAdmin, canManageUsers, canViewAllData, isInspection, canEditTimesheets, shouldShowTimesheetEntry } from '@/lib/permissions';
import { apiClient, ApiError } from '@/lib/api';

interface AuthContextType {
  user: Employee | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isInspection: () => boolean;
  canManageUsers: () => boolean;
  canViewAllData: () => boolean;
  canEditTimesheets: () => boolean;
  shouldShowTimesheetEntry: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        // Validate token by fetching current user
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data.user;
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            isActive: userData.isActive,
          });
        } else {
          // Invalid token, clear it
          apiClient.logout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      apiClient.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await apiClient.login(username, password);
      
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
        });
        setLoading(false);
        return true;
      } else {
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const checkIsAdmin = () => user ? isAdmin(user) : false;
  const checkIsInspection = () => user ? isInspection(user) : false;
  const checkCanManageUsers = () => user ? canManageUsers(user) : false;
  const checkCanViewAllData = () => user ? canViewAllData(user) : false;
  const checkCanEditTimesheets = () => user ? canEditTimesheets(user) : false;
  const checkShouldShowTimesheetEntry = () => user ? shouldShowTimesheetEntry(user) : false;
  const hasRole = (role: UserRole) => user ? user.role === role : false;

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: checkIsAdmin,
    isInspection: checkIsInspection,
    canManageUsers: checkCanManageUsers,
    canViewAllData: checkCanViewAllData,
    canEditTimesheets: checkCanEditTimesheets,
    shouldShowTimesheetEntry: checkShouldShowTimesheetEntry,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
