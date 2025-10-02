'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrophyIcon, 
  CalendarIcon, 
  UserIcon,
  AcademicCapIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { LearningModule, Certificate, User } from '@/lib/types';
import { DifficultyIndicator } from './difficulty-indicator';

interface CompletionCertificateProps {
  certificate: Certificate;
  module: LearningModule;
  user: User;
  onDownload?: () => void;
  onShare?: () => void;
}

export function CompletionCertificate({ 
  certificate, 
  module, 
  user, 
  onDownload, 
  onShare 
}: CompletionCertificateProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Certificate Preview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex justify-center">
                <AcademicCapIcon className="h-16 w-16 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate of Completion</h1>
              <p className="text-gray-600">The Game Forge Academy</p>
            </div>

            {/* Recipient */}
            <div className="space-y-4">
              <p className="text-lg text-gray-700">This is to certify that</p>
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <h2 className="text-2xl font-bold text-blue-900">{user.username}</h2>
                <p className="text-gray-600">{user.domain} Specialist</p>
              </div>
            </div>

            {/* Achievement */}
            <div className="space-y-4">
              <p className="text-lg text-gray-700">has successfully completed</p>
              <div className="bg-white rounded-lg p-6 border-2 border-blue-200 space-y-3">
                <h3 className="text-xl font-bold text-gray-900">{module.title}</h3>
                <p className="text-gray-600">{module.description}</p>
                <div className="flex items-center justify-center gap-4">
                  <Badge className="bg-blue-100 text-blue-800">
                    {module.domain}
                  </Badge>
                  <DifficultyIndicator difficulty={module.difficulty} />
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrophyIcon className="h-3 w-3" />
                    {module.xpReward} XP
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Completion Date</span>
                </div>
                <p className="text-gray-700">{formatDate(certificate.issuedAt)}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Certificate ID</span>
                </div>
                <p className="text-gray-700 font-mono text-xs">{certificate.verificationCode}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrophyIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Achievement Level</span>
                </div>
                <p className="text-gray-700 capitalize">{module.difficulty}</p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="border-t pt-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="h-16 flex items-end justify-center mb-2">
                    <div className="border-b-2 border-gray-400 w-48"></div>
                  </div>
                  <p className="text-sm font-medium">Academy Director</p>
                  <p className="text-xs text-gray-500">The Game Forge</p>
                </div>
                
                <div className="text-center">
                  <div className="h-16 flex items-end justify-center mb-2">
                    <div className="border-b-2 border-gray-400 w-48"></div>
                  </div>
                  <p className="text-sm font-medium">Domain Lead</p>
                  <p className="text-xs text-gray-500">{module.domain}</p>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
              <p className="mb-1">
                <strong>Verification:</strong> This certificate can be verified at gameforge.academy/verify
              </p>
              <p>
                <strong>Certificate ID:</strong> {certificate.verificationCode}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onDownload} className="flex items-center gap-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          Download Certificate
        </Button>
        
        <Button onClick={onShare} variant="outline" className="flex items-center gap-2">
          <ShareIcon className="h-4 w-4" />
          Share Achievement
        </Button>
        
        <Button variant="ghost" className="text-sm">
          View in Portfolio
        </Button>
      </div>

      {/* Achievement Stats */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Your Learning Achievement</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">{module.xpReward}</div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{module.content.length}</div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(module.estimatedDuration / 60)}h {module.estimatedDuration % 60}m
              </div>
              <div className="text-sm text-gray-600">Time Invested</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {module.difficulty === 'beginner' ? '1' : module.difficulty === 'intermediate' ? '2' : '3'}/3
              </div>
              <div className="text-sm text-gray-600">Difficulty Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
          <p className="text-gray-600 mb-6">
            Continue your learning journey with these recommended next steps:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline">Explore Advanced Modules</Button>
            <Button variant="outline">Join Study Groups</Button>
            <Button variant="outline">Find a Mentor</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}