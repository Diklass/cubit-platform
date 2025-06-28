// src/components/Layout.tsx
import React from 'react'
import { Header } from './Header'


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">  {/* h-full потому, что html/body уже 100% */}
      <Header />
      <main className="flex-1 overflow-hidden"> {/* сам main не скроллится */}
        {children}
      </main>
    </div>
  )
}
