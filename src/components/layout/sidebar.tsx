'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/main-anvil',
    label: 'Main Anvil',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      </svg>
    ),
  },
  {
    href: '/community',
    label: 'Community Hub',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/academy',
    label: 'The Academy',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/events',
    label: 'Events',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    badge: '3',
  },
  {
    href: '/leaderboard',
    label: 'Forge Masters',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const domainChannels = [
  { name: 'Game Development', color: 'bg-blue-500' },
  { name: 'Game Design', color: 'bg-green-500' },
  { name: 'Game Art', color: 'bg-purple-500' },
  { name: 'AI for Games', color: 'bg-orange-500' },
  { name: 'Creative', color: 'bg-pink-500' },
  { name: 'Corporate', color: 'bg-gray-500' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col overflow-y-auto py-4">
        {/* Main Navigation */}
        <nav className="space-y-1 px-3">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Domain Channels */}
        <div className="mt-8 px-3">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Domain Channels
          </h3>
          <nav className="space-y-1">
            {domainChannels.map((channel) => (
              <Link
                key={channel.name}
                href={`/community/${channel.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <div className={cn('h-2 w-2 rounded-full', channel.color)}></div>
                <span>{channel.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User Stats */}
        <div className="mt-auto px-3 py-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Your Progress</p>
                <p className="text-xs text-gray-600">Level 5 • 2,450 XP</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress to Level 6</span>
                <span>75%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-200">
                <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}