'use client';

import { Badge } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  isEarned?: boolean;
  className?: string;
}

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showTooltip = true, 
  isEarned = true,
  className 
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div 
      className={cn(
        'relative group cursor-pointer',
        className
      )}
      title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
    >
      <div className={cn(
        'rounded-full border-2 flex items-center justify-center transition-all duration-200',
        sizeClasses[size],
        isEarned 
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-md hover:shadow-lg' 
          : 'border-gray-300 bg-gray-100 opacity-50'
      )}>
        {/* Badge icon placeholder - in real app would be an image */}
        <div className={cn(
          'rounded-full flex items-center justify-center font-bold',
          size === 'sm' ? 'w-6 h-6 text-xs' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-base',
          isEarned ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-gray-600'
        )}>
          {badge.name.charAt(0)}
        </div>
      </div>
      
      {isEarned && badge.earnedAt && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          <div className="font-semibold">{badge.name}</div>
          <div className="text-xs text-gray-300">{badge.description}</div>
          {badge.earnedAt && (
            <div className="text-xs text-green-300 mt-1">
              Earned {badge.earnedAt.toLocaleDateString()}
            </div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

interface BadgeCollectionProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeCollection({ 
  badges, 
  maxDisplay = 6, 
  size = 'md',
  className 
}: BadgeCollectionProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayBadges.map((badge) => (
        <BadgeDisplay 
          key={badge.id} 
          badge={badge} 
          size={size}
          isEarned={!!badge.earnedAt}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className={cn(
          'rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center text-gray-600 font-semibold',
          size === 'sm' ? 'w-8 h-8 text-xs' : size === 'md' ? 'w-12 h-12 text-sm' : 'w-16 h-16 text-base'
        )}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}