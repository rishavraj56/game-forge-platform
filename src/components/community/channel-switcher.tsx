'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Domain } from '@/lib/types';
import { getPrimaryChannels, getSubChannels, getChannelById } from '@/lib/mock-data';
import { ChevronDownIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ChannelSwitcherProps {
  currentChannelId?: string;
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

export function ChannelSwitcher({ currentChannelId, className }: ChannelSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentChannel = currentChannelId ? getChannelById(currentChannelId) : null;
  const primaryChannels = getPrimaryChannels();
  
  // Get all channels (primary + sub) for search
  const allChannels = [
    ...primaryChannels,
    ...primaryChannels.flatMap(channel => getSubChannels(channel.id))
  ];
  
  const filteredChannels = searchQuery
    ? allChannels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allChannels;

  const handleChannelSelect = (channelId: string) => {
    router.push(`/community/channel/${channelId}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {currentChannel ? (
          <>
            <div className={cn('h-3 w-3 rounded-full mr-3', domainColors[currentChannel.domain])} />
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="flex-1 truncate font-medium text-gray-900">
              {currentChannel.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-gray-500">Select a channel...</span>
        )}
        <ChevronDownIcon className="h-4 w-4 text-gray-400 ml-2" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Channel List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredChannels.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No channels found
                </div>
              ) : (
                <div className="py-1">
                  {!searchQuery && (
                    <>
                      {/* Primary Channels */}
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Primary Channels
                      </div>
                      {primaryChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => handleChannelSelect(channel.id)}
                          className={cn(
                            'w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 transition-colors',
                            currentChannelId === channel.id && 'bg-blue-50 text-blue-900'
                          )}
                        >
                          <div className={cn('h-3 w-3 rounded-full mr-3', domainColors[channel.domain])} />
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="flex-1 truncate font-medium">
                            {channel.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMemberCount(channel.memberCount)}
                          </span>
                        </button>
                      ))}

                      {/* Sub-channels */}
                      {primaryChannels.some(channel => getSubChannels(channel.id).length > 0) && (
                        <>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 mt-2">
                            Sub-channels
                          </div>
                          {primaryChannels.map((primaryChannel) => {
                            const subChannels = getSubChannels(primaryChannel.id);
                            return subChannels.map((subChannel) => (
                              <button
                                key={subChannel.id}
                                onClick={() => handleChannelSelect(subChannel.id)}
                                className={cn(
                                  'w-full flex items-center px-6 py-2 text-left hover:bg-gray-100 transition-colors',
                                  currentChannelId === subChannel.id && 'bg-blue-50 text-blue-900'
                                )}
                              >
                                <ChatBubbleLeftRightIcon className="h-3 w-3 mr-2 text-gray-400" />
                                <span className="flex-1 truncate">
                                  {subChannel.name}
                                </span>
                                <span className="text-xs text-gray-400 ml-2">
                                  {formatMemberCount(subChannel.memberCount)}
                                </span>
                              </button>
                            ));
                          })}
                        </>
                      )}
                    </>
                  )}

                  {/* Search Results */}
                  {searchQuery && (
                    <>
                      {filteredChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => handleChannelSelect(channel.id)}
                          className={cn(
                            'w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 transition-colors',
                            currentChannelId === channel.id && 'bg-blue-50 text-blue-900'
                          )}
                        >
                          <div className={cn('h-3 w-3 rounded-full mr-3', domainColors[channel.domain])} />
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="flex-1 truncate">
                            {channel.name}
                            {channel.type === 'sub' && (
                              <span className="text-xs text-gray-500 ml-1">
                                (sub-channel)
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatMemberCount(channel.memberCount)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}