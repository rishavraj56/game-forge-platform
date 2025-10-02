import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, StarIcon, UsersIcon, TrophyIcon, BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { LearningModule, UserModuleProgress } from '@/lib/types';
import { DifficultyIndicator } from './difficulty-indicator';

interface ModulePreviewCardProps {
  module: LearningModule;
  userProgress?: UserModuleProgress;
  onStartModule?: (moduleId: string) => void;
  onContinueModule?: (moduleId: string) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function ModulePreviewCard({ 
  module, 
  userProgress, 
  onStartModule, 
  onContinueModule,
  variant = 'default'
}: ModulePreviewCardProps) {
  const isEnrolled = !!userProgress;
  const isCompleted = userProgress?.completed || false;
  const progress = userProgress?.progress || 0;

  const getDomainColor = (domain: string) => {
    const colors = {
      'Game Development': 'bg-blue-100 text-blue-800',
      'Game Design': 'bg-green-100 text-green-800',
      'Game Art': 'bg-purple-100 text-purple-800',
      'AI for Game Development': 'bg-orange-100 text-orange-800',
      'Creative': 'bg-pink-100 text-pink-800',
      'Corporate': 'bg-gray-100 text-gray-800'
    };
    return colors[domain as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleAction = () => {
    if (isCompleted) return;
    
    if (isEnrolled) {
      onContinueModule?.(module.id);
    } else {
      onStartModule?.(module.id);
    }
    
    // Navigate to module page
    window.location.href = `/academy/module/${module.id}`;
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getDomainColor(module.domain)} variant="secondary" size="sm">
                  {module.domain}
                </Badge>
                <DifficultyIndicator difficulty={module.difficulty} variant="dots" size="sm" />
              </div>
              <h3 className="font-semibold text-sm leading-tight mb-1 truncate">
                {module.title}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {module.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {formatDuration(module.estimatedDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrophyIcon className="h-3 w-3" />
                    {module.xpReward} XP
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={handleAction}>
                  {isCompleted ? 'Completed' : isEnrolled ? 'Continue' : 'Start'}
                </Button>
              </div>
            </div>
          </div>
          {isEnrolled && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600 text-white" variant="default">
              Featured
            </Badge>
            <Badge className={getDomainColor(module.domain)} variant="secondary">
              {module.domain}
            </Badge>
            <DifficultyIndicator difficulty={module.difficulty} variant="badge" />
          </div>
          <CardTitle className="text-xl leading-tight">{module.title}</CardTitle>
          <p className="text-gray-600">{module.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span>{formatDuration(module.estimatedDuration)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrophyIcon className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-yellow-600">{module.xpReward} XP</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{module.rating.toFixed(1)} ({module.enrollmentCount.toLocaleString()} enrolled)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UsersIcon className="h-4 w-4 text-gray-500" />
              <span>{module.content.length} lessons</span>
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {isEnrolled && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {module.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {module.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{module.tags.length - 4} more
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <Button 
            className="w-full" 
            size="lg"
            variant={isCompleted ? "outline" : "primary"}
            onClick={handleAction}
          >
            {isCompleted ? (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Completed
              </>
            ) : isEnrolled ? (
              'Continue Learning'
            ) : (
              'Start Learning'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getDomainColor(module.domain)} variant="secondary">
                {module.domain}
              </Badge>
              <DifficultyIndicator difficulty={module.difficulty} variant="badge" />
            </div>
            <CardTitle className="text-lg leading-tight">{module.title}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Module Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>{formatDuration(module.estimatedDuration)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <TrophyIcon className="h-4 w-4" />
            <span>{module.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{module.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <UsersIcon className="h-4 w-4" />
            <span>{module.enrollmentCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {module.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {module.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {module.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{module.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button 
          className="w-full" 
          variant={isCompleted ? "outline" : "primary"}
          size="sm"
          onClick={handleAction}
        >
          {isCompleted ? (
            <>
              <TrophyIcon className="h-4 w-4 mr-2" />
              Completed
            </>
          ) : isEnrolled ? (
            'Continue Learning'
          ) : (
            'Start Learning'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}