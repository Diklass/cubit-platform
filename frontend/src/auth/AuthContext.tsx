// frontend/src/auth/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

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

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  loginWithRoom: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, _setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Утилита, чтобы одновременно установить токен в три места
  const setToken = (t: string) => {
    localStorage.setItem('token', t);
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    _setToken(t);
  };

  // Логаут
  const logout = () => {
    _setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    navigate('/login');
  };

  // При старте приложения, если в localStorage есть токен — сразу авторизуемся
  useEffect(() => {
    if (!token) return;

    setToken(token); // установим header и storage

    // Парсим пэйлоуд JWT
    let payload: any;
    try {
      payload = JSON.parse(window.atob(token.split('.')[1]));
    } catch {
      return logout();
    }

    if (payload.role === 'GUEST') {
      // Собираем гостя из пэйлоуда
      setUser({
        id: payload.sub,
        email: '',
        role: 'GUEST',
        createdAt: '',
        updatedAt: '',
      });
    } else {
      // Для зарегистрированных — тянем профиль
      api.get<User>('/users/me')
        .then(res => setUser(res.data))
        .catch(logout);
    }
  }, [token]);

  // Вход по логину/паролю
  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ access_token: string }>('/auth/login', { email, password });
    const t = data.access_token;
    setToken(t);

    // Дождаться профиля и только потом навигировать
    const profile = (await api.get<User>('/users/me')).data;
    setUser(profile);

    navigate('/dashboard', { replace: true, state: { from: location } });
  };

  // Вход по коду комнаты
  const loginWithRoom = async (roomCode: string) => {
    const { data } = await api.post<{ access_token: string }>('/auth/room-login', { roomCode });
    const t = data.access_token;
    setToken(t);

    // Разбор гостя из JWT пэйлоуда
    const payload = JSON.parse(window.atob(t.split('.')[1]));
    setUser({
      id: payload.sub,
      email: '',
      role: 'GUEST',
      createdAt: '',
      updatedAt: '',
    });

    navigate(`/rooms/${roomCode}`, { replace: true, state: { from: location } });
  };

  return (
    <AuthContext.Provider value={{ token, user, login, loginWithRoom, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
