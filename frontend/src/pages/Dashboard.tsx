import React from 'react';
import { useAuth } from '../auth/AuthContext';

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div style={{ padding: 20 }}>
      <h1>Панель пользователя</h1>
      <button onClick={logout}>Выйти</button>
      <p>Здесь позже будет основная функциональность.</p>
    </div>
  );
};
