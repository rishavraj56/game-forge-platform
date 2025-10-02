'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CommentThread } from './comment-thread';
import { Reaction } from '@/lib/types';
import { getTopLevelComments, mockUser } from '@/lib/mock-data';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface CommentsSectionProps {
  postId: string;
  onAddComment?: (postId: string, content: string) => void;
  onReplyToComment?: (commentId: string, content: string) => void;
  onReactToComment?: (commentId: string, reactionType: Reaction['type']) => void;
}

export function CommentsSection({ 
  postId, 
  onAddComment, 
  onReplyToComment, 
  onReactToComment 
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  
  const topLevelComments = getTopLevelComments(postId);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onAddComment?.(postId, newComment);
      setNewComment('');
      setShowCommentForm(false);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span>Comments ({topLevelComments.length})</span>
          </div>
          {!showCommentForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommentForm(true)}
            >
              Add Comment
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* New Comment Form */}
        {showCommentForm && (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={mockUser.avatarUrl} alt={mockUser.username} />
                <AvatarFallback>{mockUser.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-2 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCommentForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {topLevelComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={onReplyToComment}
                onReact={onReactToComment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}