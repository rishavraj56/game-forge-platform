'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayIcon, 
  PauseIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  QuestionMarkCircleIcon,
  CodeBracketIcon,
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { LearningModule, ModuleContent, UserModuleProgress } from '@/lib/types';
import { DifficultyIndicator } from './difficulty-indicator';

interface ModuleContentViewerProps {
  module: LearningModule;
  userProgress?: UserModuleProgress;
  onProgressUpdate?: (contentId: string, completed: boolean) => void;
  onModuleComplete?: (moduleId: string) => void;
}

export function ModuleContentViewer({ 
  module, 
  userProgress, 
  onProgressUpdate,
  onModuleComplete 
}: ModuleContentViewerProps) {
  const [currentContentIndex, setCurrentContentIndex] = useState(() => {
    if (userProgress?.currentContentId) {
      const index = module.content.findIndex(c => c.id === userProgress.currentContentId);
      return index >= 0 ? index : 0;
    }
    return 0;
  });

  const [completedContent, setCompletedContent] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);

  const currentContent = module.content[currentContentIndex];
  const isLastContent = currentContentIndex === module.content.length - 1;
  const isFirstContent = currentContentIndex === 0;

  const getContentIcon = (type: ModuleContent['type']) => {
    switch (type) {
      case 'text':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'video':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'quiz':
        return <QuestionMarkCircleIcon className="h-5 w-5" />;
      case 'exercise':
        return <CodeBracketIcon className="h-5 w-5" />;
      case 'resource':
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <BookOpenIcon className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = (type: ModuleContent['type']) => {
    switch (type) {
      case 'text':
        return 'Reading';
      case 'video':
        return 'Video';
      case 'quiz':
        return 'Quiz';
      case 'exercise':
        return 'Exercise';
      case 'resource':
        return 'Resource';
      default:
        return 'Content';
    }
  };

  const handleContentComplete = () => {
    const newCompleted = new Set(completedContent);
    newCompleted.add(currentContent.id);
    setCompletedContent(newCompleted);
    
    onProgressUpdate?.(currentContent.id, true);

    // Check if all required content is completed
    const requiredContent = module.content.filter(c => c.isRequired);
    const allRequiredCompleted = requiredContent.every(c => newCompleted.has(c.id));
    
    if (allRequiredCompleted) {
      onModuleComplete?.(module.id);
    }
  };

  const handleNext = () => {
    if (!isLastContent) {
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstContent) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  const handleContentSelect = (index: number) => {
    setCurrentContentIndex(index);
  };

  const renderContent = () => {
    switch (currentContent.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {currentContent.content}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">Video Content</p>
                <p className="text-sm opacity-75 mb-6">
                  URL: {currentContent.content}
                </p>
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  {isPlaying ? (
                    <>
                      <PauseIcon className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">Interactive Quiz</h3>
              <p className="text-gray-600 mb-6">
                Test your knowledge with this interactive quiz
              </p>
              <Button>Start Quiz</Button>
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CodeBracketIcon className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Hands-on Exercise</h3>
              </div>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {currentContent.content}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Download Resources</Button>
              <Button>Submit Solution</Button>
            </div>
          </div>
        );

      case 'resource':
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">External Resource</h3>
              <p className="text-gray-600 mb-4">
                Access additional learning materials
              </p>
              <Button 
                onClick={() => window.open(currentContent.content, '_blank')}
              >
                Open Resource
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <BookOpenIcon className="h-16 w-16 mx-auto mb-4" />
            <p>Content type not supported</p>
          </div>
        );
    }
  };

  const progress = Math.round((completedContent.size / module.content.filter(c => c.isRequired).length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Module Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {module.domain}
                </Badge>
                <DifficultyIndicator difficulty={module.difficulty} />
                <Badge variant="outline" className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {Math.floor(module.estimatedDuration / 60)}h {module.estimatedDuration % 60}m
                </Badge>
              </div>
              <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
              <p className="text-gray-600">{module.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{progress}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{completedContent.size} of {module.content.filter(c => c.isRequired).length} completed</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Content Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {module.content.map((content, index) => (
                  <button
                    key={content.id}
                    onClick={() => handleContentSelect(index)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                      index === currentContentIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${
                        completedContent.has(content.id) ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {completedContent.has(content.id) ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          getContentIcon(content.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {getContentTypeLabel(content.type)}
                          </span>
                          {content.isRequired && (
                            <Badge variant="outline" size="sm">Required</Badge>
                          )}
                        </div>
                        <div className={`text-sm font-medium truncate ${
                          index === currentContentIndex ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {content.title}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getContentIcon(currentContent.type)}
                  <div>
                    <CardTitle>{currentContent.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" size="sm">
                        {getContentTypeLabel(currentContent.type)}
                      </Badge>
                      {currentContent.isRequired && (
                        <Badge variant="outline" size="sm">Required</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {!completedContent.has(currentContent.id) && (
                  <Button onClick={handleContentComplete} variant="success">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-6">
            <Button
              onClick={handlePrevious}
              disabled={isFirstContent}
              variant="outline"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              {currentContentIndex + 1} of {module.content.length}
            </div>

            <Button
              onClick={handleNext}
              disabled={isLastContent}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Module Completion */}
          {progress === 100 && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <CardContent className="text-center py-8">
                <TrophyIcon className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Congratulations!
                </h3>
                <p className="text-green-700 mb-4">
                  You've completed "{module.title}" and earned {module.xpReward} XP!
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline">Download Certificate</Button>
                  <Button>Continue to Next Module</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}