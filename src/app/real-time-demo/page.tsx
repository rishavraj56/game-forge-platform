'use client';

import React from 'react';
import { LiveActivityFeed } from '@/components/ui/live-activity-feed';
import { LiveLeaderboard } from '@/components/ui/live-leaderboard';
import { LiveChat } from '@/components/ui/live-chat';
import { RealTimeStatus } from '@/components/ui/real-time-status';
import { Card } from '@/components/ui/card';

export default function RealTimeDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Features Demo</h1>
              <p className="text-gray-600">
                Experience live updates, real-time leaderboards, and interactive chat features.
              </p>
            </div>
            <RealTimeStatus size="lg" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Activity Feed */}
          <div className="lg:col-span-1">
            <LiveActivityFeed maxItems={8} />
          </div>

          {/* Live Leaderboard */}
          <div className="lg:col-span-1">
            <LiveLeaderboard type="all-time" maxUsers={8} />
          </div>

          {/* Live Chat */}
          <div className="lg:col-span-1">
            <LiveChat channelName="real-time-demo" />
          </div>
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Leaderboard */}
          <div>
            <LiveLeaderboard type="weekly" maxUsers={6} />
          </div>

          {/* Feature Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Features</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Live Activity Feed</h4>
                  <p className="text-sm text-gray-600">
                    See community activity as it happens - quest completions, badge earnings, and more.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Dynamic Leaderboards</h4>
                  <p className="text-sm text-gray-600">
                    Watch rankings update in real-time with animated rank changes and XP gains.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Live Chat</h4>
                  <p className="text-sm text-gray-600">
                    Engage with the community through real-time messaging with typing indicators.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Connection Status</h4>
                  <p className="text-sm text-gray-600">
                    Visual indicators show connection quality and real-time status.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Bar */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Activity Feed:</span>
                <RealTimeStatus size="sm" />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Leaderboard:</span>
                <RealTimeStatus size="sm" />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Chat:</span>
                <RealTimeStatus size="sm" />
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              All systems operational • Last update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}