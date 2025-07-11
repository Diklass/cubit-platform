// src/components/Header.tsx
import React from 'react';
import { NavButton } from './NavButton';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logoSrc from '../assets/logo.svg';
import avatarSrc from '../assets/avatar.svg';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header
      className="
        sticky top-[22px] mx-[20px] 
        z-20
        bg-surface shadow-level1 rounded-lg
        h-[60px] p-[10px]
        flex items-center justify-between
      "
    >
      {/* Логотип */}
      <NavLink to="/dashboard" className="flex items-center no-underline">
        <div className="w-[60px] h-[60px] rounded-lg flex items-center justify-center flex-shrink-0">
          <img src={logoSrc} alt="Cubit Logo" className="w-[42px] h-[42px] object-contain" />
        </div>
        <span className="ml-[10px] text-[24px] font-bold text-onSurface">
          Cubit
        </span>
      </NavLink>

      {/* Справа: навигация + аватар */}
      <div className="flex items-center gap-[20px]">
        <nav className="flex items-center gap-[15px]">
          {/* Обычное меню для не-гостя */}
          {user?.role !== 'GUEST' && (
            <>
              <NavButton to="/lessons">Уроки</NavButton>
              <NavButton to="/schedule">Расписание</NavButton>
              <NavButton to="/journal">Журнал</NavButton>
              <NavButton to="/rooms">Комнаты</NavButton>
            </>
          )}

          {/* Для гостя — кнопка Войти */}
          {user?.role === 'GUEST' && (
            <NavButton to="/login">Войти</NavButton>
          )}
        </nav>

        {/* Аватар — только для авторизованных (не-гостей) */}
        {user?.role !== 'GUEST' && (
          <NavLink to="/profile" className="block">
            <img
              src={avatarSrc}
              alt="User Avatar"
              className="w-[42px] h-[42px] bg-primary-container rounded-full object-cover"
            />
          </NavLink>
        )}
      </div>
    </header>
  );
};
