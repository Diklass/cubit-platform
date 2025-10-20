import React from 'react';
import { Header } from './Header';

type LayoutProps = {
  children: React.ReactNode;
  showHeader?: boolean; // по умолчанию шапка есть
};

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {showHeader && <Header />}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: showHeader ? '10px' : 0 }}
      >
        {children}
      </main>
    </div>
  );
}
