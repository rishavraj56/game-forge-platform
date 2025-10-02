'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1",
      "md:grid-cols-2", 
      "lg:grid-cols-3",
      "xl:grid-cols-4",
      "auto-rows-min",
      className
    )}>
      {children}
    </div>
  );
}

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
  span?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function DashboardSection({ children, className, span }: DashboardSectionProps) {
  const spanClasses = [];
  
  if (span?.default) spanClasses.push(`col-span-${span.default}`);
  if (span?.md) spanClasses.push(`md:col-span-${span.md}`);
  if (span?.lg) spanClasses.push(`lg:col-span-${span.lg}`);
  if (span?.xl) spanClasses.push(`xl:col-span-${span.xl}`);

  return (
    <div className={cn(spanClasses.join(' '), className)}>
      {children}
    </div>
  );
}