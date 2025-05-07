// frontend/src/components/Header.tsx
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="bg-white shadow px-4 py-2 flex items-center justify-between">
      {/* Убрали md:hidden */}
      <button onClick={onToggleSidebar}>
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>
      <h1 className="text-xl font-semibold">Cubit</h1>
      {/* Тут можно добавить имя или аватар */}
    </header>
  );
}
