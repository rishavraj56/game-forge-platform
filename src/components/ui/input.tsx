import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    helperText, 
    id, 
    type,
    showPasswordToggle = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId} 
            className={cn(
              'block text-sm font-medium transition-colors',
              error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full px-3 py-2.5 border rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'placeholder:text-gray-400',
              // Error state
              error && 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50',
              // Success state
              success && !error && 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50',
              // Default state
              !error && !success && 'border-gray-300 hover:border-gray-400 focus:ring-blue-500 focus:border-blue-500',
              // Focus glow effect
              isFocused && !error && !success && 'shadow-lg shadow-blue-500/10',
              isFocused && error && 'shadow-lg shadow-red-500/10',
              isFocused && success && 'shadow-lg shadow-green-500/10',
              // Password field padding
              isPasswordField && showPasswordToggle && 'pr-10',
              className
            )}
            {...props}
          />
          
          {/* Password Toggle Button */}
          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

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
        
        {/* Helper Text */}
        {helperText && !error && !success && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };