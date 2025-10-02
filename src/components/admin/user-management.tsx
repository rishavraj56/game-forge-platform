'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { mockLeaderboardUsers } from '@/lib/mock-data';
import { User, UserRole, Domain } from '@/lib/types';

interface UserRowProps {
  user: User;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onUserAction: (userId: string, action: 'suspend' | 'activate' | 'delete') => void;
}

function UserRow({ user, onRoleChange, onUserAction }: UserRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  const handleSaveRole = () => {
    onRoleChange(user.id, selectedRole);
    setIsEditing(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'domain_lead': return 'bg-green-100 text-green-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{user.domain}</span>
      </td>
      
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              className="w-32"
              options={[
                { value: 'member', label: 'Member' },
                { value: 'domain_lead', label: 'Domain Lead' },
                { value: 'admin', label: 'Admin' }
              ]}
            />
            <Button size="sm" onClick={handleSaveRole}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge className={getRoleBadgeColor(user.role)}>
              {user.role.replace('_', ' ')}
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="text-xs"
            >
              Edit
            </Button>
          </div>
        )}
      </td>
      
      <td className="px-4 py-3">
        <div className="text-sm">
          <div className="font-medium">{user.xp.toLocaleString()} XP</div>
          <div className="text-gray-500">Level {user.level}</div>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{formatDate(user.createdAt)}</span>
      </td>
      
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{formatDate(user.updatedAt)}</span>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onUserAction(user.id, 'suspend')}
            className="text-xs"
          >
            Suspend
          </Button>
          <Button 
            size="sm" 
            variant="danger"
            onClick={() => onUserAction(user.id, 'delete')}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockLeaderboardUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [domainFilter, setDomainFilter] = useState<Domain | 'all'>('all');

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleUserAction = (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    switch (action) {
      case 'delete':
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        break;
      case 'suspend':
        // In a real app, this would update the user's status
        console.log(`Suspending user ${userId}`);
        break;
      case 'activate':
        console.log(`Activating user ${userId}`);
        break;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDomain = domainFilter === 'all' || user.domain === domainFilter;
    
    return matchesSearch && matchesRole && matchesDomain;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by username or email..."
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
                { value: 'domain_lead', label: 'Domain Leads' },
                { value: 'admin', label: 'Admins' }
              ]}
            />
            
            <Select
              value={domainFilter}
              onValueChange={(value) => setDomainFilter(value as Domain | 'all')}
              options={[
                { value: 'all', label: 'All Domains' },
                { value: 'Game Development', label: 'Game Development' },
                { value: 'Game Art', label: 'Game Art' },
                { value: 'Game Design', label: 'Game Design' },
                { value: 'AI for Game Development', label: 'AI for Game Development' },
                { value: 'Creative', label: 'Creative' },
                { value: 'Corporate', label: 'Corporate' }
              ]}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XP / Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={handleRoleChange}
                    onUserAction={handleUserAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}