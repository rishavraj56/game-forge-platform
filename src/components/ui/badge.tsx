'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    outline: 'bg-transparent text-gray-700 border-gray-300',
    destructive: 'bg-red-100 text-red-800 border-red-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-semibold transition-colors',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}