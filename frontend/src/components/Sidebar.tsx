import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const links = [
    { to: '/dashboard', icon: <HomeIcon className="h-6 w-6" />, label: 'Дашборд' },
    { to: '/lessons', icon: <BookOpenIcon className="h-6 w-6" />, label: 'Уроки' },
    { to: '/rooms', icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />, label: 'Комнаты' },
    { to: '/profile', icon: <UserIcon className="h-6 w-6" />, label: 'Профиль' },
  ];

  return (
    <nav className="flex flex-col h-full">
      <div className="flex-1">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 ${
                isActive ? 'bg-gray-200 font-medium' : ''
              }`
            }
          >
            {icon}
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </div>
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 hover:bg-gray-100"
        aria-label="toggle sidebar"
      >
        {collapsed ? (
          <ChevronRightIcon className="h-6 w-6" />
        ) : (
          <ChevronLeftIcon className="h-6 w-6" />
        )}
      </button>
    </nav>
  );
}
