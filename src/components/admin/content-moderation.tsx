'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { mockPosts, mockLeaderboardUsers } from '@/lib/mock-data';
import { Post, User } from '@/lib/types';

interface ReportedContent {
  id: string;
  type: 'post' | 'comment' | 'user';
  contentId: string;
  reportedBy: User;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reportedAt: Date;
  content?: Post;
  reportedUser?: User;
}

// Mock reported content data
const mockReportedContent: ReportedContent[] = [
  {
    id: 'report-1',
    type: 'post',
    contentId: 'post-1',
    reportedBy: mockLeaderboardUsers[1],
    reason: 'Spam',
    description: 'This post appears to be promotional spam and not relevant to game development.',
    status: 'pending',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    content: mockPosts[0]
  },
  {
    id: 'report-2',
    type: 'post',
    contentId: 'post-2',
    reportedBy: mockLeaderboardUsers[2],
    reason: 'Inappropriate Content',
    description: 'Contains offensive language and inappropriate imagery.',
    status: 'pending',
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    content: mockPosts[1]
  },
  {
    id: 'report-3',
    type: 'user',
    contentId: 'user-harassment',
    reportedBy: mockLeaderboardUsers[3],
    reason: 'Harassment',
    description: 'User has been sending inappropriate direct messages and harassing community members.',
    status: 'reviewed',
    reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    reportedUser: mockLeaderboardUsers[9]
  }
];

interface ReportCardProps {
  report: ReportedContent;
  onAction: (reportId: string, action: 'approve' | 'dismiss' | 'escalate') => void;
}

function ReportCard({ report, onAction }: ReportCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'Spam': return 'bg-orange-100 text-orange-800';
      case 'Inappropriate Content': return 'bg-red-100 text-red-800';
      case 'Harassment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
            <Badge className={getReasonColor(report.reason)}>
              {report.reason}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatDate(report.reportedAt)}
            </span>
          </div>
          <div className="flex gap-2">
            {report.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onAction(report.id, 'approve')}
                >
                  Take Action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(report.id, 'dismiss')}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onAction(report.id, 'escalate')}
                >
                  Escalate
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Reporter Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-6 h-6">
              <AvatarImage src={report.reportedBy.avatarUrl} alt={report.reportedBy.username} />
              <AvatarFallback>{report.reportedBy.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              Reported by <strong>{report.reportedBy.username}</strong>
            </span>
          </div>

          {/* Report Description */}
          <div>
            <p className="text-sm text-gray-700 mb-2">{report.description}</p>
          </div>

          {/* Content Preview */}
          {report.content && (
            <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-300">
              <div className="text-xs text-gray-500 mb-1">Reported Content:</div>
              <p className="text-sm text-gray-700 line-clamp-3">
                {report.content.content}
              </p>
            </div>
          )}

          {/* Reported User */}
          {report.reportedUser && (
            <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-300">
              <div className="text-xs text-red-600 mb-1">Reported User:</div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={report.reportedUser.avatarUrl} alt={report.reportedUser.username} />
                  <AvatarFallback>{report.reportedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{report.reportedUser.username}</span>
                <span className="text-xs text-gray-500">({report.reportedUser.domain})</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContentModeration() {
  const [reports, setReports] = useState<ReportedContent[]>(mockReportedContent);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');

  const handleReportAction = (reportId: string, action: 'approve' | 'dismiss' | 'escalate') => {
    setReports(prevReports => 
      prevReports.map(report => {
        if (report.id === reportId) {
          let newStatus: ReportedContent['status'];
          switch (action) {
            case 'approve':
              newStatus = 'resolved';
              break;
            case 'dismiss':
              newStatus = 'dismissed';
              break;
            case 'escalate':
              newStatus = 'reviewed';
              break;
            default:
              newStatus = report.status;
          }
          return { ...report, status: newStatus };
        }
        return report;
      })
    );
  };

  const filteredReports = reports.filter(report => 
    statusFilter === 'all' || report.status === statusFilter
  );

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const reviewedCount = reports.filter(r => r.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending Reports</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{reviewedCount}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {reports.filter(r => r.status === 'dismissed').length}
            </div>
            <div className="text-sm text-gray-600">Dismissed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div>
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onAction={handleReportAction}
            />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                No reports found for the selected filter
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}