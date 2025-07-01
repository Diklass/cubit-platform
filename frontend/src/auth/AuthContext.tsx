// frontend/src/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export type User = {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUEST';
  createdAt: string;
  updatedAt: string;
};

export type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithRoom: (roomCode: string) => Promise<void>;
  logout: () => void;
};

// **Обратите внимание**: в createContext сразу передаём все методы, включая loginWithRoom
const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  loginWithRoom: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // При изменении токена: сохраняем в localStorage, ставим заголовок и тянем профиль
  useEffect(() => {
    if (!token) {
      // разлогинились
      setUser(null);
      localStorage.removeItem('token');
      delete api.defaults.headers.common.Authorization;
      return;
    }

    // ставим токен в хранилище и заголовок
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    // распарсим пэйлоуд
    try {
      const payload = JSON.parse(window.atob(token.split('.')[1]));
      if (payload.role === 'GUEST') {
        // сразу выставляем гостя из пэйлоуда
        setUser({
          id: payload.sub,
          email: '',              // у гостя email нет
          role: 'GUEST',
          createdAt: '',
          updatedAt: '',
        });
        return;
      }
    } catch {
      // некорректный токен
      setToken(null);
      return;
    }

    // для не-гостя — запрашиваем профиль
    api.get<User>('/users/me')
      .then(res => setUser(res.data))
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete api.defaults.headers.common.Authorization;
        navigate('/login');
      });
  }, [token, navigate]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/login', { email, password });
    setToken(res.data.access_token);
    navigate('/dashboard');
  };

  const loginWithRoom = async (roomCode: string) => {
    const res = await api.post<{ access_token: string }>('/auth/room-login', { roomCode });
    setToken(res.data.access_token);
    navigate(`/rooms/${roomCode}`);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, loginWithRoom, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
