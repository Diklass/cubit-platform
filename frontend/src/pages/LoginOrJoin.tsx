// frontend/src/pages/LoginOrJoin.tsx
import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Login from './Login';

export const LoginOrJoin: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'room'>('login');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithRoom } = useAuth();

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithRoom(code.trim());
    } catch (err: any) {
      // если сервер вернул 404 — комната не найдена, иначе общая ошибка
      if (err.response?.status === 404) {
        setError('Комната с таким кодом не найдена.');
      } else {
        setError('Не удалось соединиться с сервером. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setMode('login')}
          className={`px-4 py-2 focus:outline-none ${
            mode === 'login'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          По паролю
        </button>
        <button
          onClick={() => setMode('room')}
          className={`px-4 py-2 focus:outline-none ${
            mode === 'room'
              ? 'border-b-2 border-blue-500 font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          По коду комнаты
        </button>
      </div>

      {mode === 'login' ? (
        <Login />
      ) : (
        <form onSubmit={handleRoomSubmit} aria-busy={loading}>
          <h2 className="text-xl font-medium mb-4">Войти в комнату</h2>

          <label htmlFor="roomCode" className="block mb-1 font-medium">
            Код комнаты
          </label>
          <input
            id="roomCode"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-describedby="roomCodeError"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Вхожу…' : 'Войти'}
          </button>

          <p
            id="roomCodeError"
            role="alert"
            className="mt-2 text-sm text-red-600"
          >
            {error}
          </p>
        </form>
      )}
    </div>
  );
};

export default LoginOrJoin;
