'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { ChannelSidebar, ChannelBreadcrumbs, SubChannelList, DiscussionFeed } from '@/components/community';
import { Card, CardContent } from '@/components/ui/card';
import { getChannelById, getSubChannels } from '@/lib/mock-data';
import { ChatBubbleLeftRightIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  
  const channel = getChannelById(channelId);
  const subChannels = getSubChannels(channelId);

  if (!channel) {
    return (
      <MainLayout showSidebar={false}>
        <div className="flex h-[calc(100vh-4rem)]">
          <ChannelSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Channel Not Found</h1>
              <p className="text-gray-600">The channel you&apos;re looking for doesn&apos;t exist.</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k members`;
    }
    return `${count} members`;
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="flex h-[calc(100vh-4rem)]">
        <ChannelSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Channel Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <ChannelBreadcrumbs channelId={channelId} className="mb-3" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{channel.name}</h1>
                  {channel.description && (
                    <p className="text-gray-600 mt-1">{channel.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  <span>{formatMemberCount(channel.memberCount)}</span>
                </div>
                

              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Sub-channels (if primary channel) */}
              {channel.type === 'primary' && subChannels.length > 0 && (
                <SubChannelList parentChannelId={channelId} />
              )}

              {/* Discussion Feed */}
              <DiscussionFeed channelId={channelId} />

              {/* Channel Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{channel.memberCount}</div>
                      <div className="text-sm text-gray-600">Members</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.floor(Math.random() * 100) + 50}
                      </div>
                      <div className="text-sm text-gray-600">Posts Today</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {subChannels.length}
                      </div>
                      <div className="text-sm text-gray-600">Sub-channels</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}