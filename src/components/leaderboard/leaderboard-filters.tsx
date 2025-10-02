'use client';

import React from 'react';
import { Domain } from '@/lib/types';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface LeaderboardFiltersProps {
  selectedDomain: Domain | 'all';
  searchQuery: string;
  onDomainChange: (domain: Domain | 'all') => void;
  onSearchChange: (query: string) => void;
  className?: string;
}

const domainOptions = [
  { value: 'all', label: 'All Domains' },
  { value: 'Game Development', label: 'Game Development' },
  { value: 'Game Design', label: 'Game Design' },
  { value: 'Game Art', label: 'Game Art' },
  { value: 'AI for Game Development', label: 'AI for Game Development' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Corporate', label: 'Corporate' }
];

export function LeaderboardFilters({
  selectedDomain,
  searchQuery,
  onDomainChange,
  onSearchChange,
  className
}: LeaderboardFiltersProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {/* Domain Filter */}
      <div className="flex-1 min-w-0">
        <Select
          label="Filter by Domain"
          options={domainOptions}
          value={selectedDomain}
          onValueChange={(value) => onDomainChange(value as Domain | 'all')}
          className="w-full"
        />
      </div>
      
      {/* Search Input */}
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Users
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <Input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}