'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';
import { mockLeaderboardUsers } from '@/lib/mock-data';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  UserGroupIcon,
  StarIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface MemberDirectoryProps {
  className?: string;
}

interface FilterState {
  search: string;
  domain: string;
  minLevel: string;
  role: string;
}

const domainOptions = [
  { value: '', label: 'All Domains' },
  { value: 'Game Development', label: 'Game Development' },
  { value: 'Game Design', label: 'Game Design' },
  { value: 'Game Art', label: 'Game Art' },
  { value: 'AI for Game Development', label: 'AI for Game Development' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Corporate', label: 'Corporate' }
];

const levelOptions = [
  { value: '', label: 'Any Level' },
  { value: '1', label: 'Level 1+' },
  { value: '5', label: 'Level 5+' },
  { value: '10', label: 'Level 10+' },
  { value: '15', label: 'Level 15+' }
];

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'member', label: 'Members' },
  { value: 'domain_lead', label: 'Domain Leads' },
  { value: 'admin', label: 'Admins' }
];

export function MemberDirectory({ className }: MemberDirectoryProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    domain: '',
    minLevel: '',
    role: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search members
  const filteredMembers = useMemo(() => {
    return mockLeaderboardUsers.filter(member => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          member.username.toLowerCase().includes(searchTerm) ||
          member.bio?.toLowerCase().includes(searchTerm) ||
          member.domain.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Domain filter
      if (filters.domain && member.domain !== filters.domain) {
        return false;
      }

      // Level filter
      if (filters.minLevel && member.level < parseInt(filters.minLevel)) {
        return false;
      }

      // Role filter
      if (filters.role && member.role !== filters.role) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      domain: '',
      minLevel: '',
      role: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2" />
            Member Directory
          </h2>
          <p className="text-gray-600 mt-1">
            Discover and connect with {mockLeaderboardUsers.length} community members
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="default" className="ml-2">
              {Object.values(filters).filter(v => v !== '').length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members by name, bio, or domain..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Domain"
                  options={domainOptions}
                  value={filters.domain}
                  onValueChange={(value) => handleFilterChange('domain', value)}
                />
                
                <Select
                  label="Minimum Level"
                  options={levelOptions}
                  value={filters.minLevel}
                  onValueChange={(value) => handleFilterChange('minLevel', value)}
                />
                
                <Select
                  label="Role"
                  options={roleOptions}
                  value={filters.role}
                  onValueChange={(value) => handleFilterChange('role', value)}
                />
              </div>
              
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredMembers.length} of {mockLeaderboardUsers.length} members
        </span>
        {hasActiveFilters && (
          <span className="text-blue-600">
            Filters applied
          </span>
        )}
      </div>

      {/* Member Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find more members.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MemberCardProps {
  member: User;
}

function MemberCard({ member }: MemberCardProps) {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'domain_lead': return 'Domain Lead';
      case 'admin': return 'Admin';
      default: return 'Member';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatarUrl} alt={member.username} />
            <AvatarFallback>
              {member.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {member.username}
            </h3>
            <p className="text-sm text-gray-600 truncate">{member.domain}</p>
            
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={member.role === 'admin' ? 'destructive' : member.role === 'domain_lead' ? 'default' : 'secondary'}
              >
                {getRoleDisplayName(member.role)}
              </Badge>
              
              <div className="flex items-center text-xs text-gray-500">
                <StarIcon className="h-3 w-3 mr-1" />
                Level {member.level}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {member.bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {member.xp.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total XP</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {member.badges.length}
            </div>
            <div className="text-xs text-gray-500">Badges</div>
          </div>
        </div>

        {/* Badges Preview */}
        {member.badges.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-1 mb-2">
              <TrophyIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Recent Badges</span>
            </div>
            <div className="flex space-x-1">
              {member.badges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center"
                  title={badge.name}
                >
                  <TrophyIcon className="h-3 w-3 text-white" />
                </div>
              ))}
              {member.badges.length > 3 && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{member.badges.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
            Message
          </Button>
          <Button variant="ghost" size="sm">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}