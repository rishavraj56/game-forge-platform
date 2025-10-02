'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ChannelSidebar, ChannelBreadcrumbs, ChannelSwitcher } from '@/components/community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPrimaryChannels } from '@/lib/mock-data';
import { ChatBubbleLeftRightIcon, UsersIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function CommunityPage() {
  const primaryChannels = getPrimaryChannels();

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
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <ChannelBreadcrumbs className="mb-3" />
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Community Hub</h1>
                <p className="text-gray-600 mt-1">Connect, collaborate, and share knowledge with fellow developers</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <a
                  href="/community/members"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Member Directory
                </a>
                
                <div className="w-64">
                  <ChannelSwitcher />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Domain Channels Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Domain Channels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {primaryChannels.map((channel) => (
                      <a
                        key={channel.id}
                        href={`/community/channel/${channel.id}`}
                        className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center mb-3">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {channel.name}
                          </h3>
                        </div>
                        
                        {channel.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {channel.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            <span>{formatMemberCount(channel.memberCount)}</span>
                          </div>
                          <div className="flex items-center text-green-600">
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                            <span>Active</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Community Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">DevMaster</h4>
                            <span className="text-sm text-gray-500">in Game Development</span>
                            <span className="text-sm text-gray-400">2h ago</span>
                          </div>
                          <p className="text-gray-700 mt-1">Best practices for implementing AI behavior trees in Unity?</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>12 replies</span>
                            <span>45 likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">ArtisticCoder</h4>
                            <span className="text-sm text-gray-500">in Game Art</span>
                            <span className="text-sm text-gray-400">4h ago</span>
                          </div>
                          <p className="text-gray-700 mt-1">Sharing my latest character design workflow using Blender and Substance Painter</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>8 replies</span>
                            <span>32 likes</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pb-4">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">GameDesignGuru</h4>
                            <span className="text-sm text-gray-500">in Game Design</span>
                            <span className="text-sm text-gray-400">6h ago</span>
                          </div>
                          <p className="text-gray-700 mt-1">How to balance difficulty curves in puzzle games - lessons learned</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>15 replies</span>
                            <span>67 likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {primaryChannels.reduce((sum, channel) => sum + channel.memberCount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">6</div>
                      <div className="text-sm text-gray-600">Domain Channels</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">10</div>
                      <div className="text-sm text-gray-600">Sub-channels</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.floor(Math.random() * 500) + 200}
                      </div>
                      <div className="text-sm text-gray-600">Posts Today</div>
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