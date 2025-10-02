'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}>
      {children}
    </div>
  );
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function AvatarImage({ src, alt, className }: AvatarImageProps) {
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      className={cn('aspect-square h-full w-full object-cover', className)}
    />
  );
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export function AvatarFallback({ children, className }: AvatarFallbackProps) {
  return (
    <div className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium',
      className
    )}>
      {children}
    </div>
  );
}