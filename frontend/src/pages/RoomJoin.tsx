// src/pages/RoomJoin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import AnimatedSubmitButton from '../components/ui/AnimatedSubmitButton';
import { motion } from 'framer-motion';
import { useTheme } from "@mui/material/styles";

export type Room = { id: string; code: string; title?: string };

export function RoomJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingList(true);
    api.get<Room[]>('/rooms')
      .then(res => setRooms(res.data))
      .catch(() => setError('Не удалось загрузить список комнат'))
      .finally(() => setLoadingList(false));
  }, []);

  const enterRoom = (code: string) => navigate(`/rooms/${code}`);

  const createRoom = async () => {
    if (!title.trim()) { setError('Введите название комнаты'); return; }
    setError(null);
    setCreating(true);
    try {
      const { data } = await api.post<Room>('/rooms', { title: title.trim() });
      setRooms(prev => [...prev, data]);
      navigate(`/rooms/${data.code}`);
    } catch {
      setError('Не удалось создать комнату');
    } finally { setCreating(false); }
  };

  const handleEnterRoom = (room: Room) => {
  setPressedId(room.id);
  setTimeout(() => navigate(`/rooms/${room.code}`), 180);
};

const Card: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => {
  const theme = useTheme();

  return (
    <section
      className="rounded-2xl shadow-level1 p-5 transition-colors"
      style={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <h2 className="text-xl font-semibold mb-3 text-center">{title}</h2>
      {children}
    </section>
  );
};

const RoomsList: React.FC = () => (
  <div className="space-y-3">
    {loadingList && <div className="text-gray-500 text-center">Загрузка…</div>}
    {!loadingList && rooms.length === 0 && (
      <div className="text-gray-500 text-center">Пока нет комнат.</div>
    )}

    {!loadingList &&
      rooms.map((r) => {
        const active = pressedId === r.id;
        const label = r.title || r.code;
        const sub   = r.title ? `код: ${r.code}` : '';

        return (
      <AnimatedSubmitButton
        key={r.id}
        tone={active ? 'primary' : 'neutral'}
        activeRect={active}
        fullWidth
        onClick={() => handleEnterRoom(r)}
        sx={{ justifyContent: 'space-between', px: 2.2, py: 1.4, fontWeight: 700 }}
      >
        <span className="truncate">{label}</span>
        {sub && <span className="ml-2 opacity-70 text-sm">{sub}</span>}
      </AnimatedSubmitButton>
        );
      })}
  </div>
);

  const spring = { type: 'spring', stiffness: 520, damping: 28, mass: 0.7 } as const;


  return (
    <div className="mx-[20px] min-h-[calc(100vh-120px)] flex items-center">
      <div className={isTeacher ? 'w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6' : 'w-full max-w-3xl mx-auto'}>
        {/* список комнат — есть у всех */}
        <Card title={isStudent ? 'Мои комнаты' : 'Ваши комнаты'}>
          {error && <div className="text-red-500 mb-3">{error}</div>}
          <RoomsList />
        </Card>

        {/* создание — только для учителя/админа */}
        {isTeacher && (
          <Card title="Создать новую комнату">
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Название новой комнаты"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <AnimatedSubmitButton fullWidth loading={creating} onClick={createRoom}>
                Создать комнату
              </AnimatedSubmitButton>
              <p className="text-xs text-gray-500 text-center">Код комнаты будет сгенерирован автоматически.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
