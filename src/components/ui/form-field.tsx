import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  success?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ 
  children, 
  label,
  error, 
  success, 
  description,
  required,
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className={cn(
          'block text-sm font-medium',
          error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700'
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {description && !error && !success && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {/* Success Message */}
      {success && !error && (
        <div className="flex items-center gap-2 text-sm text-green-600 animate-in slide-in-from-left-2 duration-200">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 animate-in slide-in-from-left-2 duration-200">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export { FormField };