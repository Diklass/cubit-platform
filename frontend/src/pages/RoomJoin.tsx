// frontend/src/pages/RoomJoin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth/AuthContext';

export default function RoomJoin() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const joinRoom = async () => {
    try {
      await api.get(`/rooms/${code}`);
      navigate(`/rooms/${code}`);
    } catch {
      setError('Комната не найдена');
    }
  };

  const createRoom = async () => {
    try {
      const { data } = await api.post('/rooms', { title });
      setCreatedCode(data.code);
      setError('');
    } catch {
      setError('У вас нет прав на создание комнаты');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded space-y-4">
      <h1 className="text-xl font-semibold text-center">Комнаты Cubit</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-2">
        <label className="block font-medium">Код комнаты</label>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Введите код..."
        />
        <button
          onClick={joinRoom}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Войти
        </button>
      </div>

      {user?.role !== 'STUDENT' && (
        <div className="border-t pt-4 space-y-2">
          <label className="block font-medium">Создать комнату</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Название (необязательно)"
          />
          <button
            onClick={createRoom}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Создать
          </button>
          {createdCode && (
            <p className="mt-2">
              Ваша комната: <strong>{createdCode}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
