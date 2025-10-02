'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/notification-bell';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <span className="text-xl font-bold text-gray-900">Game Forge</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/main-anvil" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Main Anvil
          </Link>
          <Link href="/community" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Community Hub
          </Link>
          <Link href="/academy" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            The Academy
          </Link>
          <Link href="/events" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Events
          </Link>
          <Link href="/leaderboard" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Forge Masters
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <NotificationBell userId="1" />

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
            <Button variant="primary" size="sm">
              Login
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}