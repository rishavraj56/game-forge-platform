'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleBrowser } from '@/components/academy/module-browser';
import { ModulePreviewCard } from '@/components/academy/module-preview-card';
import { mockLearningModules, getUserInProgressModules, getRecommendedModules, getUserCompletedModules } from '@/lib/mock-data';
import { BookOpenIcon, TrophyIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function AcademyPage() {
  const userId = '1'; // Mock user ID
  const userDomain = 'Game Development'; // Mock user domain
  
  const inProgressModules = getUserInProgressModules(userId);
  const completedModules = getUserCompletedModules(userId);
  const recommendedModules = getRecommendedModules(userId, userDomain);
  const featuredModules = mockLearningModules
    .filter(module => module.isPublished && module.rating >= 4.8)
    .slice(0, 3);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">The Academy</h1>
          <p className="text-gray-600">Expand your skills with curated learning content and mentorship</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Continue Learning Section */}
            {inProgressModules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Continue Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {inProgressModules.slice(0, 2).map((module) => (
                      <ModulePreviewCard
                        key={module.id}
                        module={module}
                        userProgress={getUserInProgressModules(userId).find(m => m.id === module.id) ? {
                          userId,
                          moduleId: module.id,
                          completed: false,
                          progress: module.id === 'module-2' ? 65 : 30,
                          startedAt: new Date(),
                          timeSpent: 0
                        } : undefined}
                        variant="compact"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                  Featured Learning Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {featuredModules.slice(0, 2).map((module) => (
                    <ModulePreviewCard
                      key={module.id}
                      module={module}
                      variant="featured"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended for You */}
            {recommendedModules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenIcon className="h-5 w-5" />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recommendedModules.slice(0, 3).map((module) => (
                      <ModulePreviewCard
                        key={module.id}
                        module={module}
                        variant="compact"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Browse All Modules */}
            <ModuleBrowser userId={userId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedModules.length}</div>
                    <div className="text-sm text-gray-500">Modules Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {completedModules.reduce((total, module) => total + module.xpReward, 0)}
                    </div>
                    <div className="text-sm text-gray-500">XP from Learning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{completedModules.length}</div>
                    <div className="text-sm text-gray-500">Certificates Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{inProgressModules.length}</div>
                    <div className="text-sm text-gray-500">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {completedModules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedModules.slice(0, 2).map((module) => (
                      <div key={module.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                        <TrophyIcon className="h-6 w-6 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-green-900">
                            Completed {module.title}
                          </div>
                          <div className="text-xs text-green-700">
                            +{module.xpReward} XP earned
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mentorship Program */}
            <Card>
              <CardHeader>
                <CardTitle>The Guild</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Join our mentorship program to get guidance from experienced developers.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium text-sm">Sarah Chen</div>
                      <div className="text-xs text-gray-500">Unity Expert • 8 years exp</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-purple-500"></div>
                    <div>
                      <div className="font-medium text-sm">Mike Rodriguez</div>
                      <div className="text-xs text-gray-500">Game Designer • 6 years exp</div>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  size="sm"
                  onClick={() => window.location.href = '/academy/guild'}
                >
                  Find a Mentor
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <div className="font-medium text-sm">Unity Workshop</div>
                    <div className="text-xs text-gray-500">Tomorrow, 2:00 PM</div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="font-medium text-sm">Game Design Webinar</div>
                    <div className="text-xs text-gray-500">Friday, 3:00 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}