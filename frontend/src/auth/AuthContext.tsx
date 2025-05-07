import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export type User = {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  createdAt: string;
  updatedAt: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // При изменении токена — сохраняем и загружаем профиль
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Запросим профиль
      api.get<User>('/users/me')
        .then(res => setUser(res.data))
        .catch(() => {
          // Если токен просрочен или неверный — разлогиниваем
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          delete api.defaults.headers.common.Authorization;
          navigate('/login');
        });
    } else {
      setUser(null);
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
    }
  }, [token, navigate]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/login', { email, password });
    setToken(res.data.access_token);
    navigate('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
