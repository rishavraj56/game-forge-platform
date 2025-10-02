'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({ count, className, showZero = false }: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white',
        count > 99 && 'px-1',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}