'use client';

import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { FormAccessibility } from '@/lib/accessibility';
import { useAccessibility } from '@/components/providers/accessibility-provider';

// Form Field Container
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={clsx('form-field space-y-2', className)}>
      {children}
    </div>
  );
}

// Label Component
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export function FormLabel({ required, children, className, ...props }: FormLabelProps) {
  return (
    <label
      className={clsx(
        'block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-destructive" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

// Input Component
interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, helpText, required, className, id, name, ...props }, ref) => {
    const { announceToScreenReader } = useAccessibility();
    const fieldName = name || id || 'field';
    const ids = FormAccessibility.generateFieldIds(fieldName);

    const describedBy = FormAccessibility.createDescribedBy([
      error ? ids.error : '',
      helpText ? ids.help : '',
    ]);

    React.useEffect(() => {
      if (error) {
        announceToScreenReader(FormAccessibility.getValidationMessage(label || fieldName, error), 'assertive');
      }
    }, [error, label, fieldName, announceToScreenReader]);

    return (
      <div className="space-y-2">
        {label && (
          <FormLabel htmlFor={ids.field} required={required}>
            {label}
          </FormLabel>
        )}
        
        <input
          ref={ref}
          id={ids.field}
          name={name}
          className={clsx(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive ring-destructive',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          aria-required={required}
          {...props}
        />

        {helpText && (
          <p id={ids.help} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}

        {error && (
          <p id={ids.error} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Textarea Component
interface AccessibleTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, error, helpText, required, className, id, name, ...props }, ref) => {
    const { announceToScreenReader } = useAccessibility();
    const fieldName = name || id || 'field';
    const ids = FormAccessibility.generateFieldIds(fieldName);

    const describedBy = FormAccessibility.createDescribedBy([
      error ? ids.error : '',
      helpText ? ids.help : '',
    ]);

    React.useEffect(() => {
      if (error) {
        announceToScreenReader(FormAccessibility.getValidationMessage(label || fieldName, error), 'assertive');
      }
    }, [error, label, fieldName, announceToScreenReader]);

    return (
      <div className="space-y-2">
        {label && (
          <FormLabel htmlFor={ids.field} required={required}>
            {label}
          </FormLabel>
        )}
        
        <textarea
          ref={ref}
          id={ids.field}
          name={name}
          className={clsx(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive ring-destructive',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          aria-required={required}
          {...props}
        />

        {helpText && (
          <p id={ids.help} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}

        {error && (
          <p id={ids.error} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Select Component
interface AccessibleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  children: React.ReactNode;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ label, error, helpText, required, placeholder, children, className, id, name, ...props }, ref) => {
    const { announceToScreenReader } = useAccessibility();
    const fieldName = name || id || 'field';
    const ids = FormAccessibility.generateFieldIds(fieldName);

    const describedBy = FormAccessibility.createDescribedBy([
      error ? ids.error : '',
      helpText ? ids.help : '',
    ]);

    React.useEffect(() => {
      if (error) {
        announceToScreenReader(FormAccessibility.getValidationMessage(label || fieldName, error), 'assertive');
      }
    }, [error, label, fieldName, announceToScreenReader]);

    return (
      <div className="space-y-2">
        {label && (
          <FormLabel htmlFor={ids.field} required={required}>
            {label}
          </FormLabel>
        )}
        
        <select
          ref={ref}
          id={ids.field}
          name={name}
          className={clsx(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive ring-destructive',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          aria-required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>

        {helpText && (
          <p id={ids.help} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}

        {error && (
          <p id={ids.error} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

// Checkbox Component
interface AccessibleCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ label, description, error, className, id, name, ...props }, ref) => {
    const { announceToScreenReader } = useAccessibility();
    const fieldName = name || id || 'checkbox';
    const ids = FormAccessibility.generateFieldIds(fieldName);

    const describedBy = FormAccessibility.createDescribedBy([
      error ? ids.error : '',
      description ? ids.help : '',
    ]);

    React.useEffect(() => {
      if (error) {
        announceToScreenReader(FormAccessibility.getValidationMessage(label, error), 'assertive');
      }
    }, [error, label, announceToScreenReader]);

    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <input
            ref={ref}
            type="checkbox"
            id={ids.field}
            name={name}
            className={clsx(
              'h-4 w-4 rounded border border-input bg-background text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          
          <div className="flex-1 space-y-1">
            <FormLabel htmlFor={ids.field} className="cursor-pointer">
              {label}
            </FormLabel>
            
            {description && (
              <p id={ids.help} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {error && (
          <p id={ids.error} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

// Radio Group Component
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface AccessibleRadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleRadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  helpText,
  required,
  className,
}: AccessibleRadioGroupProps) {
  const { announceToScreenReader } = useAccessibility();
  const ids = FormAccessibility.generateFieldIds(name);

  const describedBy = FormAccessibility.createDescribedBy([
    error ? ids.error : '',
    helpText ? ids.help : '',
  ]);

  React.useEffect(() => {
    if (error) {
      announceToScreenReader(FormAccessibility.getValidationMessage(label, error), 'assertive');
    }
  }, [error, label, announceToScreenReader]);

  return (
    <fieldset className={clsx('space-y-4', className)}>
      <legend className="text-sm font-medium leading-none">
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-label="required">
            *
          </span>
        )}
      </legend>

      <div
        className="space-y-3"
        role="radiogroup"
        aria-labelledby={ids.label}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              className={clsx(
                'h-4 w-4 border border-input bg-background text-primary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-destructive'
              )}
            />
            
            <div className="flex-1 space-y-1">
              <label
                htmlFor={`${name}-${option.value}`}
                className="text-sm font-medium cursor-pointer"
              >
                {option.label}
              </label>
              
              {option.description && (
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {helpText && (
        <p id={ids.help} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}

      {error && (
        <p id={ids.error} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}