'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WidgetContainerProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'featured';
}

export function WidgetContainer({ 
  title, 
  children, 
  className, 
  headerAction,
  size = 'md',
  variant = 'default'
}: WidgetContainerProps) {
  const sizeClasses = {
    sm: 'min-h-[200px]',
    md: 'min-h-[300px]',
    lg: 'min-h-[400px]',
    xl: 'min-h-[500px]'
  };

  const variantClasses = {
    default: 'border border-gray-200',
    compact: 'border border-gray-200 p-3',
    featured: 'border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
  };

  return (
    <Card className={cn(
      sizeClasses[size],
      variantClasses[variant],
      'transition-all duration-200 hover:shadow-md',
      className
    )}>
      {title && (
        <CardHeader className={cn(
          'flex flex-row items-center justify-between space-y-0',
          variant === 'compact' ? 'pb-2' : 'pb-4'
        )}>
          <CardTitle className={cn(
            'font-semibold',
            variant === 'compact' ? 'text-sm' : 'text-lg'
          )}>
            {title}
          </CardTitle>
          {headerAction && (
            <div className="flex items-center space-x-2">
              {headerAction}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        'flex-1',
        variant === 'compact' ? 'pt-0' : '',
        !title ? 'pt-6' : ''
      )}>
        {children}
      </CardContent>
    </Card>
  );
}