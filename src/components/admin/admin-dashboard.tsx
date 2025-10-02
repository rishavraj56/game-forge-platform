'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardGrid, DashboardSection } from '@/components/dashboard/dashboard-grid';
import { AdminMetrics } from './admin-metrics';
import { UserManagement } from './user-management';
import { ContentModeration } from './content-moderation';

type AdminView = 'overview' | 'users' | 'moderation';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>('overview');

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <AdminMetrics />;
      case 'users':
        return <UserManagement />;
      case 'moderation':
        return <ContentModeration />;
      default:
        return <AdminMetrics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, content, and platform settings
          </p>
        </div>

        {/* Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={activeView === 'overview' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('overview')}
              >
                Overview
              </Button>
              <Button
                variant={activeView === 'users' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('users')}
              >
                User Management
              </Button>
              <Button
                variant={activeView === 'moderation' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('moderation')}
              >
                Content Moderation
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