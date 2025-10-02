import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './loading-spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    loadingText,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden';
    
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus-visible:ring-blue-500 shadow-lg hover:shadow-xl',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus-visible:ring-gray-500 shadow-lg hover:shadow-xl',
      outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500 hover:border-gray-400',
      ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
      success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus-visible:ring-green-500 shadow-lg hover:shadow-xl',
      danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus-visible:ring-red-500 shadow-lg hover:shadow-xl'
    };
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-13 px-7 text-base'
    };
    
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(
          baseStyles, 
          variants[variant], 
          sizes[size], 
          loading && 'cursor-wait',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            {loadingText || 'Loading...'}
          </div>
        ) : (
          children
        )}
        
        {/* Ripple effect overlay */}
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200 rounded-lg"></div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };