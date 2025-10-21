import React from 'react';
import { Header } from './Header';

type LayoutProps = {
  children: React.ReactNode;
  showHeader?: boolean; // по умолчанию шапка есть
};

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <>
          <Header />
          {/* единый вертикальный зазор между шапкой и контентом */}
          <div className="h-[20px]" aria-hidden />
        </>
      )}

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
