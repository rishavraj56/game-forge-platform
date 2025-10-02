'use client';

import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ 
  title = 'Error', 
  message, 
  onRetry, 
  className 
}: ErrorMessageProps) {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className="text-red-600 mb-2">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ 
  title = 'Something went wrong', 
  message, 
  onRetry, 
  className 
}: ErrorCardProps) {
  return (
    <Card className={cn('max-w-md mx-auto', className)}>
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      className={className}
    />
  );
}

interface NotFoundErrorProps {
  resource?: string;
  onGoBack?: () => void;
  className?: string;
}

export function NotFoundError({ 
  resource = 'page', 
  onGoBack, 
  className 
}: NotFoundErrorProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="text-gray-400 mb-4">
        <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found
      </h2>
      <p className="text-gray-600 mb-6">
        The {resource} you're looking for doesn't exist or has been moved.
      </p>
      {onGoBack && (
        <Button onClick={onGoBack}>
          Go Back
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  message, 
  action, 
  icon, 
  className 
}: EmptyStateProps) {
  const defaultIcon = (
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface RetryableErrorProps {
  error: Error;
  onRetry: () => void;
  maxRetries?: number;
  currentRetry?: number;
  className?: string;
}

export function RetryableError({ 
  error, 
  onRetry, 
  maxRetries = 3, 
  currentRetry = 0, 
  className 
}: RetryableErrorProps) {
  const canRetry = currentRetry < maxRetries;

  return (
    <ErrorCard
      title={canRetry ? 'Temporary Error' : 'Error'}
      message={
        canRetry 
          ? `${error.message} (Attempt ${currentRetry + 1}/${maxRetries})`
          : `${error.message}. Maximum retry attempts reached.`
      }
      onRetry={canRetry ? onRetry : undefined}
      className={className}
    />
  );
}