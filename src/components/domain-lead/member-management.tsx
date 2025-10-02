'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { mockLeaderboardUsers } from '@/lib/mock-data';
import { Domain, User, UserRole } from '@/lib/types';

interface MemberManagementProps {
  domain: Domain;
}

export function MemberManagement({ domain }: MemberManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Filter members by domain
  const domainMembers = mockLeaderboardUsers.filter(user => user.domain === domain);

  // Apply search and role filters
  const filteredMembers = domainMembers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSelectMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(user => user.id));
    }
  };

  const handlePromoteToLead = (userId: string) => {
    // Mock function - in real app would make API call
    console.log(`Promoting user ${userId} to domain lead`);
  };

  const handleSendMessage = (userIds: string[]) => {
    // Mock function - in real app would open messaging interface
    console.log(`Sending message to users: ${userIds.join(', ')}`);
  };

  const handleBulkAction = (action: string) => {
    // Mock function - in real app would perform bulk operations
    console.log(`Performing ${action} on users: ${selectedMembers.join(', ')}`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
          <p className="text-gray-600">Manage members in the {domain} domain</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSendMessage(selectedMembers)} disabled={selectedMembers.length === 0}>
            Message Selected ({selectedMembers.length})
          </Button>
          <Button variant="primary">Invite Members</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'member', label: 'Members' },
                { value: 'domain_lead', label: 'Domain Leads' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedMembers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('message')}>
                  Send Message
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('assign_quest')}>
                  Assign Quest
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('add_to_event')}>
                  Add to Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Domain Members ({filteredMembers.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedMembers.length === filteredMembers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user.id)}
                  onChange={() => handleSelectMember(user.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                
                <Avatar className="w-12 h-12">
                  <img src={user.avatarUrl || '/avatars/default-avatar.png'} alt={user.username} />
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{user.username}</h4>
                    <Badge variant={user.role === 'domain_lead' ? 'default' : 'secondary'}>
                      {user.role === 'domain_lead' ? 'Domain Lead' : 'Member'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">Level {user.level}</span>
                    <span className="text-sm text-gray-600">{user.xp.toLocaleString()} XP</span>
                    <span className="text-sm text-gray-600">{user.badges.length} badges</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleSendMessage([user.id])}>
                    Message
                  </Button>
                  {user.role === 'member' && (
                    <Button variant="outline" size="sm" onClick={() => handlePromoteToLead(user.id)}>
                      Promote
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No members found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{domainMembers.length}</div>
            <p className="text-xs text-green-600 mt-1">+5 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Domain Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {domainMembers.filter(u => u.role === 'domain_lead').length}
            </div>
            <p className="text-xs text-blue-600 mt-1">Leadership team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(domainMembers.reduce((sum, u) => sum + u.level, 0) / domainMembers.length)}
            </div>
            <p className="text-xs text-purple-600 mt-1">Community growth</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}