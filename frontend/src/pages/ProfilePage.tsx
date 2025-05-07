import React, { useEffect, useState } from 'react';
import api from '../api';

type Profile = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Profile>('/users/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Не удалось загрузить профиль'));
  }, []);

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!profile) return <p className="p-4">Загружаем профиль…</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Профиль</h1>
      <ul className="space-y-2">
        <li><strong>ID:</strong> {profile.id}</li>
        <li><strong>Email:</strong> {profile.email}</li>
        <li><strong>Роль:</strong> {profile.role}</li>
        <li><strong>Зарегистрирован:</strong> {new Date(profile.createdAt).toLocaleString()}</li>
        <li><strong>Обновлён:</strong> {new Date(profile.updatedAt).toLocaleString()}</li>
      </ul>
    </div>
  );
}
