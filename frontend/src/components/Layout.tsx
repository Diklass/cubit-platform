// src/components/Layout.tsx
import React from 'react'
import { Header } from './Header'

type LayoutProps = {
  children: React.ReactNode;
  showHeader?: boolean; // <- добавили
}

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {showHeader && <Header />}          {/* <- условно показываем шапку */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
