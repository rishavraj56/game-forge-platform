'use client';

import React from 'react';
import { LoadingSpinner, LoadingCard, LoadingList } from './loading-states';
import { ErrorMessage, NetworkError, RetryableError } from './error-states';
import { cn } from '@/lib/utils';

interface AsyncWrapperProps {
  loading: boolean;
  error: string | Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
  retryCount?: number;
  maxRetries?: number;
}

export function AsyncWrapper({
  loading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  className,
  retryCount = 0,
  maxRetries = 3
}: AsyncWrapperProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        {loadingComponent || <LoadingSpinner size="lg" />}
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    
    // Check if it's a network error
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return (
        <div className={className}>
          <NetworkError onRetry={onRetry} />
        </div>
      );
    }

    // Check if it's a retryable error
    if (onRetry && retryCount < maxRetries) {
      return (
        <div className={className}>
          <RetryableError
            error={error instanceof Error ? error : new Error(errorMessage)}
            onRetry={onRetry}
            maxRetries={maxRetries}
            currentRetry={retryCount}
          />
        </div>
      );
    }

    return (
      <div className={className}>
        <ErrorMessage
          message={errorMessage}
          onRetry={onRetry}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

interface AsyncListWrapperProps {
  loading: boolean;
  error: string | Error | null;
  data: any[] | null;
  onRetry?: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  loadingCount?: number;
  className?: string;
}

export function AsyncListWrapper({
  loading,
  error,
  data,
  onRetry,
  children,
  emptyMessage = 'No items found',
  emptyAction,
  loadingCount = 3,
  className
}: AsyncListWrapperProps) {
  if (loading) {
    return (
      <div className={className}>
        <LoadingList count={loadingCount} />
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : error;
    return (
      <div className={className}>
        <ErrorMessage
          message={errorMessage}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{emptyMessage}</p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

interface AsyncCardWrapperProps {
  loading: boolean;
  error: string | Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AsyncCardWrapper({
  loading,
  error,
  onRetry,
  children,
  className
}: AsyncCardWrapperProps) {
  if (loading) {
    return (
      <div className={className}>
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : error;
    return (
      <div className={className}>
        <ErrorMessage
          message={errorMessage}
          onRetry={onRetry}
        />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}