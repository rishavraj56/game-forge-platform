'use client';

import React from 'react';
import Link from 'next/link';
import { getSubChannels } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatBubbleLeftRightIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';

interface SubChannelListProps {
  parentChannelId: string;
  className?: string;
}

export function SubChannelList({ parentChannelId, className }: SubChannelListProps) {
  const subChannels = getSubChannels(parentChannelId);

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k members`;
    }
    return `${count} members`;
  };

  if (subChannels.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Sub-channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No sub-channels yet</p>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Sub-channel
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Sub-channels ({subChannels.length})
          </CardTitle>
          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <PlusIcon className="h-3 w-3 mr-1" />
            Create
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subChannels.map((subChannel) => (
            <Link
              key={subChannel.id}
              href={`/community/channel/${subChannel.id}`}
              className="group block"
            >
              <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {subChannel.name}
                    </h3>
                  </div>
                </div>
                
                {subChannel.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {subChannel.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  <span>{formatMemberCount(subChannel.memberCount)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}