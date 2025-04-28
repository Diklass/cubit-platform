import React, { createContext, useContext, useState, ReactNode } from 'react';
import api from '../api';

interface AuthContextType {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const accessToken = res.data.access_token as string;
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
  };

  // Подставляем токен в Axios при перезагрузке
  if (token && !api.defaults.headers.common.Authorization) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
