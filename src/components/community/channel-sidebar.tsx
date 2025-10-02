'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Domain } from '@/lib/types';
import { getPrimaryChannels, getSubChannels } from '@/lib/mock-data';
import { ChevronDownIcon, ChevronRightIcon, ChatBubbleLeftRightIcon, UsersIcon } from '@heroicons/react/24/outline';

interface ChannelSidebarProps {
  className?: string;
}

const domainColors: Record<Domain, string> = {
  'Game Development': 'bg-blue-500',
  'Game Design': 'bg-green-500',
  'Game Art': 'bg-purple-500',
  'AI for Game Development': 'bg-orange-500',
  'Creative': 'bg-pink-500',
  'Corporate': 'bg-gray-500',
};

export function ChannelSidebar({ className }: ChannelSidebarProps) {
  const pathname = usePathname();
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set(['channel-1']));
  
  const primaryChannels = getPrimaryChannels();

  const toggleChannel = (channelId: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channelId)) {
      newExpanded.delete(channelId);
    } else {
      newExpanded.add(channelId);
    }
    setExpandedChannels(newExpanded);
  };

  const isChannelActive = (channelId: string) => {
    return pathname.includes(`/community/channel/${channelId}`);
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className={cn('w-80 bg-white border-r border-gray-200 h-full overflow-y-auto', className)}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Community Channels</h2>
        <p className="text-sm text-gray-600 mt-1">Connect with your domain community</p>
      </div>

      <div className="p-2">
        {primaryChannels.map((channel) => {
          const subChannels = getSubChannels(channel.id);
          const isExpanded = expandedChannels.has(channel.id);
          const isActive = isChannelActive(channel.id);
          const hasSubChannels = subChannels.length > 0;

          return (
            <div key={channel.id} className="mb-1">
              {/* Primary Channel */}
              <div className="flex items-center group">
                {hasSubChannels && (
                  <button
                    onClick={() => toggleChannel(channel.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                )}
                
                <Link
                  href={`/community/channel/${channel.id}`}
                  className={cn(
                    'flex items-center flex-1 px-2 py-2 rounded-md text-sm font-medium transition-colors',
                    hasSubChannels ? 'ml-0' : 'ml-6',
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <div className={cn('h-3 w-3 rounded-full mr-3', domainColors[channel.domain])} />
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="flex-1 truncate">{channel.name}</span>
                  <div className="flex items-center text-xs text-gray-500 ml-2">
                    <UsersIcon className="h-3 w-3 mr-1" />
                    <span>{formatMemberCount(channel.memberCount)}</span>
                  </div>
                </Link>
              </div>

              {/* Sub-channels */}
              {hasSubChannels && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {subChannels.map((subChannel) => {
                    const isSubActive = isChannelActive(subChannel.id);
                    
                    return (
                      <Link
                        key={subChannel.id}
                        href={`/community/channel/${subChannel.id}`}
                        className={cn(
                          'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
                          isSubActive
                            ? 'bg-blue-50 text-blue-800'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        )}
                      >
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="flex-1 truncate">{subChannel.name}</span>
                        <div className="flex items-center text-xs text-gray-400 ml-2">
                          <UsersIcon className="h-3 w-3 mr-1" />
                          <span>{formatMemberCount(subChannel.memberCount)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <div className="space-y-2">
          <Link
            href="/community/members"
            className={cn(
              "flex items-center w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              pathname === '/community/members'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Member Directory
          </Link>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
            + Create Sub-channel
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
            Browse All Channels
          </button>
        </div>
      </div>
    </div>
  );
}