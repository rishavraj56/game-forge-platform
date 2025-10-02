'use client';

import React from 'react';
import { DomainLeadDashboard } from '@/components/domain-lead';
import { mockUser } from '@/lib/mock-data';

export default function DomainLeadPage() {
  // In a real app, this would come from authentication context
  const currentUser = mockUser;
  
  // Check if user has domain lead or admin permissions
  if (currentUser.role !== 'domain_lead' && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the domain lead dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <DomainLeadDashboard 
      domain={currentUser.domain} 
      userRole={currentUser.role as 'domain_lead' | 'admin'} 
    />
  );
}