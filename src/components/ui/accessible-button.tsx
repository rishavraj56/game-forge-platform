'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useAccessibility } from '@/components/providers/accessibility-provider';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Loading...',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { announceToScreenReader, prefersReducedMotion } = useAccessibility();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }

      // Announce button action to screen readers if it's an important action
      if (variant === 'primary' || variant === 'destructive') {
        const buttonText = typeof children === 'string' ? children : 'Button activated';
        announceToScreenReader(buttonText);
      }

      onClick?.(event);
    };

    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      
      // Motion preferences
      prefersReducedMotion ? '' : 'transition-all duration-200 ease-in-out',
      
      // Full width
      fullWidth ? 'w-full' : '',
    ];

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95',
    };

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        onClick={handleClick}
        {...props}
      >
        {loading && (
          <>
            <svg
              className={clsx(
                'animate-spin',
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
                children ? 'mr-2' : ''
              )}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">{loadingText}</span>
          </>
        )}

        {!loading && icon && iconPosition === 'left' && (
          <span className={clsx('flex-shrink-0', children ? 'mr-2' : '')} aria-hidden="true">
            {icon}
          </span>
        )}

        {loading ? loadingText : children}

        {!loading && icon && iconPosition === 'right' && (
          <span className={clsx('flex-shrink-0', children ? 'ml-2' : '')} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';