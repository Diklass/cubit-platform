// frontend/src/components/Layout.tsx
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className={`flex-1 overflow-auto bg-gray-50 transition-margin duration-200
            ${sidebarOpen ? 'ml-64' : 'ml-0'}
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
