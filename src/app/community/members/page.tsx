'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { ChannelSidebar, ChannelBreadcrumbs, MemberDirectory } from '@/components/community';

export default function MembersPage() {
  return (
    <MainLayout showSidebar={false}>
      <div className="flex h-[calc(100vh-4rem)]">
        <ChannelSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <ChannelBreadcrumbs className="mb-3" />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <MemberDirectory />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}