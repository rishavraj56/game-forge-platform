'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DomainAnalytics } from './domain-analytics';
import { MemberManagement } from './member-management';
import { ContentCuration } from './content-curation';
import { Domain } from '@/lib/types';

type DomainLeadView = 'analytics' | 'members' | 'content';

interface DomainLeadDashboardProps {
  domain: Domain;
  userRole: 'domain_lead' | 'admin';
}

export function DomainLeadDashboard({ domain, userRole }: DomainLeadDashboardProps) {
  const [activeView, setActiveView] = useState<DomainLeadView>('analytics');

  const renderContent = () => {
    switch (activeView) {
      case 'analytics':
        return <DomainAnalytics domain={domain} />;
      case 'members':
        return <MemberManagement domain={domain} />;
      case 'content':
        return <ContentCuration domain={domain} />;
      default:
        return <DomainAnalytics domain={domain} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {domain} Dashboard
            </h1>
            <Badge variant="default" className="text-sm">
              {userRole === 'admin' ? 'Admin Access' : 'Domain Lead'}
            </Badge>
          </div>
          <p className="text-gray-600">
            Manage your domain community, content, and member engagement
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Members</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active This Week</p>
                  <p className="text-2xl font-bold">892</p>
                </div>
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Pending Content</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
                <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Upcoming Events</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={activeView === 'analytics' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('analytics')}
              >
                Analytics & Insights
              </Button>
              <Button
                variant={activeView === 'members' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('members')}
              >
                Member Management
              </Button>
              <Button
                variant={activeView === 'content' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('content')}
              >
                Content Curation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}