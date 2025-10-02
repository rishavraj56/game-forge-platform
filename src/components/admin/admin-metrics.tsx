'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardGrid, DashboardSection } from '@/components/dashboard/dashboard-grid';
import { mockLeaderboardUsers, mockPosts, mockEvents, mockChannels } from '@/lib/mock-data';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
}

function MetricCard({ title, value, change, changeType = 'neutral', description }: MetricCardProps) {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {change && (
          <div className={`text-sm ${changeColor}`}>
            {change}
          </div>
        )}
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminMetrics() {
  // Calculate metrics from mock data
  const totalUsers = mockLeaderboardUsers.length;
  const totalPosts = mockPosts.length;
  const totalEvents = mockEvents.length;
  const totalChannels = mockChannels.length;
  
  const activeUsers = mockLeaderboardUsers.filter(user => 
    new Date(user.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const domainLeads = mockLeaderboardUsers.filter(user => user.role === 'domain_lead').length;
  const admins = mockLeaderboardUsers.filter(user => user.role === 'admin').length;

  const avgXP = Math.round(mockLeaderboardUsers.reduce((sum, user) => sum + user.xp, 0) / totalUsers);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <DashboardGrid>
        <DashboardSection>
          <MetricCard
            title="Total Users"
            value={totalUsers}
            change="+12% this month"
            changeType="positive"
            description="Registered community members"
          />
        </DashboardSection>
        
        <DashboardSection>
          <MetricCard
            title="Active Users (7d)"
            value={activeUsers}
            change="+8% from last week"
            changeType="positive"
            description="Users active in past 7 days"
          />
        </DashboardSection>
        
        <DashboardSection>
          <MetricCard
            title="Total Posts"
            value={totalPosts}
            change="+24 today"
            changeType="positive"
            description="Community posts created"
          />
        </DashboardSection>
        
        <DashboardSection>
          <MetricCard
            title="Active Events"
            value={totalEvents}
            change="3 this week"
            changeType="neutral"
            description="Upcoming community events"
          />
        </DashboardSection>
      </DashboardGrid>

      {/* Detailed Analytics */}
      <DashboardGrid>
        <DashboardSection span={{ default: 1, lg: 2 }}>
          <Card>
            <CardHeader>
              <CardTitle>User Roles Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Members</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${((totalUsers - domainLeads - admins) / totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{totalUsers - domainLeads - admins}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Domain Leads</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(domainLeads / totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{domainLeads}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Admins</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(admins / totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{admins}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </DashboardSection>

        <DashboardSection span={{ default: 1, lg: 2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Domain Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Game Development', 'Game Art', 'Game Design', 'AI for Game Development', 'Creative', 'Corporate'].map(domain => {
                  const count = mockLeaderboardUsers.filter(user => user.domain === domain).length;
                  const percentage = (count / totalUsers) * 100;
                  
                  return (
                    <div key={domain} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{domain}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </DashboardSection>
      </DashboardGrid>

      {/* Additional Metrics */}
      <DashboardGrid>
        <DashboardSection>
          <MetricCard
            title="Average XP"
            value={avgXP.toLocaleString()}
            description="Per user engagement level"
          />
        </DashboardSection>
        
        <DashboardSection>
          <MetricCard
            title="Total Channels"
            value={totalChannels}
            description="Active discussion channels"
          />
        </DashboardSection>
        
        <DashboardSection>
          <MetricCard
            title="Reported Content"
            value={3}
            change="2 pending review"
            changeType="neutral"
            description="Content moderation queue"
          />
        </DashboardSection>
        
        <DashboardSection>
          <MetricCard
            title="System Health"
            value="Excellent"
            change="99.9% uptime"
            changeType="positive"
            description="Platform performance"
          />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}