import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  title, 
  children, 
  className 
}) => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-600',
      iconPath: 'M5 13l4 4L19 7'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  const variantStyles = variants[variant];

  return (
    <div className={cn(
      'p-4 border rounded-lg transition-all duration-200',
      variantStyles.container,
      className
    )}>
      <div className="flex items-start gap-3">
        <svg 
          className={cn('h-5 w-5 flex-shrink-0 mt-0.5', variantStyles.icon)} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={variantStyles.iconPath} 
          />
        </svg>
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

export { Alert };