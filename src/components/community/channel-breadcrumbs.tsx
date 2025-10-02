'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { getChannelPath } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface ChannelBreadcrumbsProps {
  channelId?: string;
  className?: string;
}

export function ChannelBreadcrumbs({ channelId, className }: ChannelBreadcrumbsProps) {
  if (!channelId) {
    return (
      <nav className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
        <Link 
          href="/community" 
          className="flex items-center hover:text-gray-900 transition-colors"
        >
          <HomeIcon className="h-4 w-4 mr-1" />
          Community Hub
        </Link>
      </nav>
    );
  }

  const channelPath = getChannelPath(channelId);
  
  if (channelPath.length === 0) {
    return (
      <nav className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
        <Link 
          href="/community" 
          className="flex items-center hover:text-gray-900 transition-colors"
        >
          <HomeIcon className="h-4 w-4 mr-1" />
          Community Hub
        </Link>
      </nav>
    );
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
      <Link 
        href="/community" 
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <HomeIcon className="h-4 w-4 mr-1" />
        Community Hub
      </Link>
      
      {channelPath.map((channel, index) => {
        const isLast = index === channelPath.length - 1;
        const href = `/community/channel/${channel.id}`;
        
        return (
          <React.Fragment key={channel.id}>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900">
                {channel.name}
              </span>
            ) : (
              <Link 
                href={href}
                className="hover:text-gray-900 transition-colors"
              >
                {channel.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}