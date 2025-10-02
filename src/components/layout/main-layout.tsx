'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 ${showSidebar ? 'ml-64' : ''}`}>
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}