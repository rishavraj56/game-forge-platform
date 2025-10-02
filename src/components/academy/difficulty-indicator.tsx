import { Badge } from '@/components/ui/badge';
import { Difficulty } from '@/lib/types';

interface DifficultyIndicatorProps {
  difficulty: Difficulty;
  variant?: 'badge' | 'dots' | 'bar';
  size?: 'sm' | 'md' | 'lg';
}

export function DifficultyIndicator({ 
  difficulty, 
  variant = 'badge', 
  size = 'md' 
}: DifficultyIndicatorProps) {
  const getDifficultyConfig = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return {
          label: 'Beginner',
          color: 'bg-green-100 text-green-800 border-green-200',
          level: 1,
          dotColor: 'bg-green-500'
        };
      case 'intermediate':
        return {
          label: 'Intermediate',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          level: 2,
          dotColor: 'bg-orange-500'
        };
      case 'advanced':
        return {
          label: 'Advanced',
          color: 'bg-red-100 text-red-800 border-red-200',
          level: 3,
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          level: 0,
          dotColor: 'bg-gray-500'
        };
    }
  };

  const config = getDifficultyConfig(difficulty);

  if (variant === 'badge') {
    return (
      <Badge 
        variant="outline" 
        className={`${config.color} ${
          size === 'sm' ? 'text-xs px-2 py-0.5' : 
          size === 'lg' ? 'text-sm px-3 py-1' : 
          'text-xs px-2 py-1'
        }`}
      >
        {config.label}
      </Badge>
    );
  }

  if (variant === 'dots') {
    const dotSize = size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';
    const gap = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-2' : 'gap-1.5';

    return (
      <div className={`flex items-center ${gap}`}>
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`${dotSize} rounded-full ${
              level <= config.level ? config.dotColor : 'bg-gray-200'
            }`}
          />
        ))}
        {size !== 'sm' && (
          <span className={`ml-2 text-gray-600 ${
            size === 'lg' ? 'text-sm' : 'text-xs'
          }`}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'bar') {
    const barHeight = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';
    const percentage = (config.level / 3) * 100;

    return (
      <div className="space-y-1">
        <div className={`w-full ${barHeight} bg-gray-200 rounded-full overflow-hidden`}>
          <div
            className={`${barHeight} ${config.dotColor} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {size !== 'sm' && (
          <span className={`text-gray-600 ${
            size === 'lg' ? 'text-sm' : 'text-xs'
          }`}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  return null;
}