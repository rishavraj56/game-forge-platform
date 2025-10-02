'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockLeaderboardUsers, mockChannels, mockPosts, mockEvents } from '@/lib/mock-data';
import { Domain } from '@/lib/types';

interface DomainAnalyticsProps {
  domain: Domain;
}

export function DomainAnalytics({ domain }: DomainAnalyticsProps) {
  // Filter data by domain
  const domainMembers = mockLeaderboardUsers.filter(user => user.domain === domain);
  const domainChannels = mockChannels.filter(channel => channel.domain === domain);
  const domainEvents = mockEvents.filter(event => event.domain === domain);
  
  // Calculate analytics
  const totalMembers = domainMembers.length;
  const totalXP = domainMembers.reduce((sum, user) => sum + user.xp, 0);
  const averageXP = totalMembers > 0 ? Math.round(totalXP / totalMembers) : 0;
  const activeChannels = domainChannels.filter(channel => channel.isActive).length;
  const upcomingEvents = domainEvents.filter(event => event.startDate > new Date()).length;
  
  // Top performers
  const topPerformers = domainMembers
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  // Recent activity (mock data for demonstration)
  const recentActivity = [
    { type: 'New Member', count: 12, change: '+8%' },
    { type: 'Posts Created', count: 45, change: '+15%' },
    { type: 'Quests Completed', count: 89, change: '+22%' },
    { type: 'Modules Finished', count: 34, change: '+5%' }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{averageXP.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeChannels}</div>
            <p className="text-xs text-blue-600 mt-1">{domainChannels.length} total channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{upcomingEvents}</div>
            <p className="text-xs text-purple-600 mt-1">{domainEvents.length} total events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{user.xp.toLocaleString()} XP</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'domain_lead' ? 'Domain Lead' : 'Member'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{activity.type}</p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{activity.count}</p>
                    <p className={`text-xs ${activity.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {domainChannels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{channel.name}</h4>
                  <p className="text-sm text-gray-500">{channel.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{channel.memberCount} members</p>
                  <Badge variant={channel.type === 'primary' ? 'default' : 'secondary'}>
                    {channel.type === 'primary' ? 'Primary' : 'Sub-channel'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}