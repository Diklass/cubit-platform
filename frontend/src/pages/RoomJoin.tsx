// src/pages/RoomJoin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';

export type Room = {
  id: string;
  code: string;
  title?: string;
};

export function RoomJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');     // новоё состояние
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем «свои» комнаты
    api.get<Room[]>('/rooms')
      .then(res => setRooms(res.data))
      .catch(() => setError('Не удалось загрузить список комнат'));
  }, []);

  const enterRoom = (code: string) => {
    navigate(`/rooms/${code}`);
  };

  // Для учителя/админа: создание новой комнаты
  const createRoom = async () => {
    setError(null);
    try {
      const { data } = await api.post<Room>('/rooms', { title });
      setRooms(prev => [...prev, data]);
      navigate(`/rooms/${data.code}`);
    } catch {
      setError('Не удалось создать комнату');
    }
  };

  // Для студента: ввод и «присоединение» к существующей комнате
  const joinExistingRoom = async () => {
    if (!joinCode.trim()) {
      setError('Введите код комнаты');
      return;
    }
    setError(null);
    try {
      // Предполагаем, что у бэкенда есть этот эндпоинт:
      await api.post(`/rooms/${joinCode}/join`);
      navigate(`/rooms/${joinCode}`);
    } catch {
      setError('Комната с таким кодом не найдена или недоступна');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Комнаты</h2>
      {error && <div className="text-red-500">{error}</div>}

      {/* Студент видит форму «Войти по коду» */}
      {user?.role === 'STUDENT' && (
        <div className="space-y-2">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Введите код комнаты"
            className="w-full border px-3 py-2 rounded"
          />
          <button
            onClick={joinExistingRoom}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Войти в комнату
          </button>
        </div>
      )}

      {/* Общий список комнат, в которые вы уже в составе */}
      <ul className="space-y-2">
        {rooms.map(r => (
          <li key={r.id}>
            <button
              onClick={() => enterRoom(r.code)}
              className="block w-full text-left bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
            >
              {r.title || r.code} {r.title && <span className="text-sm text-gray-500">(код: {r.code})</span>}
            </button>
          </li>
        ))}
      </ul>

      {/* Учитель/админ могут ещё и создавать новую */}
      {user?.role !== 'STUDENT' && (
        <div className="pt-4 border-t space-y-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название новой комнаты"
            className="w-full border px-3 py-2 rounded"
          />
          <button
            onClick={createRoom}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Создать комнату
          </button>
        </div>
      )}
    </div>
  );
}
