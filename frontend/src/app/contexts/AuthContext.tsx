'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getSavedUser,
  getSavedPreferences,
  saveAuth,
  removeToken,
  getToken,
  type User,
} from '../lib/auth';

interface AuthContextType {
  user: User | null;
  preferences: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  loginSuccess: (data: { user: User; preferences: string[]; token: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  preferences: [],
  isAuthenticated: false,
  isLoading: true,
  loginSuccess: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = getSavedUser();
    const savedPrefs = getSavedPreferences();
    const token = getToken();

    if (savedUser && token) {
      setUser(savedUser);
      setPreferences(savedPrefs);
    }
    setIsLoading(false);
  }, []);

  const loginSuccess = useCallback((data: { user: User; preferences: string[]; token: string }) => {
    saveAuth(data);
    setUser(data.user);
    setPreferences(data.preferences);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setPreferences([]);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isAuthenticated: !!user,
        isLoading,
        loginSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
