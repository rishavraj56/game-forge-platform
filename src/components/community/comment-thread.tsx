'use client';

import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Comment, Reaction } from '@/lib/types';
import { getUserById, getReplies } from '@/lib/mock-data';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon
} from '@heroicons/react/24/solid';

interface CommentThreadProps {
  comment: Comment;
  level?: number;
  onReply?: (commentId: string, content: string) => void;
  onReact?: (commentId: string, reactionType: Reaction['type']) => void;
}

interface CommentItemProps {
  comment: Comment;
  level: number;
  onReply?: (commentId: string, content: string) => void;
  onReact?: (commentId: string, reactionType: Reaction['type']) => void;
}

function CommentItem({ comment, level, onReply, onReact }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReaction, setUserReaction] = useState<Reaction['type'] | null>(null);
  
  const author = getUserById(comment.authorId);
  const replies = getReplies(comment.id);
  const [showReplies, setShowReplies] = useState(true);

  if (!author) {
    return null;
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onReply?.(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = (reactionType: Reaction['type']) => {
    setUserReaction(userReaction === reactionType ? null : reactionType);
    onReact?.(comment.id, reactionType);
  };

  const getTotalReactions = () => {
    return comment.reactions.length;
  };

  const marginLeft = Math.min(level * 24, 96); // Max 4 levels of nesting

  return (
    <div className="relative">
      {/* Threading line for nested comments */}
      {level > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"
          style={{ left: `${marginLeft - 12}px` }}
        />
      )}
      
      <div 
        className="flex space-x-3 py-3"
        style={{ marginLeft: `${marginLeft}px` }}
      >
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={author.avatarUrl} alt={author.username} />
          <AvatarFallback>{author.username.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm">{author.username}</h4>
            <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <EllipsisHorizontalIcon className="h-3 w-3" />
            </button>
          </div>

          {/* Comment Content */}
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-xs">
            <button
              onClick={() => handleReaction('like')}
              className={`flex items-center space-x-1 hover:text-blue-600 transition-colors ${
                userReaction === 'like' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {userReaction === 'like' ? (
                <HandThumbUpIcon className="h-3 w-3" />
              ) : (
                <HeartIcon className="h-3 w-3" />
              )}
              <span>Like</span>
              {getTotalReactions() > 0 && (
                <span className="text-gray-400">({getTotalReactions()})</span>
              )}
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ChatBubbleLeftIcon className="h-3 w-3" />
              <span>Reply</span>
            </button>

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                {showReplies ? (
                  <ChevronUpIcon className="h-3 w-3" />
                ) : (
                  <ChevronDownIcon className="h-3 w-3" />
                )}
                <span>{showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-3">
              <div className="flex space-x-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src="/avatars/default-avatar.png" alt="You" />
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!replyContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Replying...' : 'Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          level={level + 1}
          onReply={onReply}
          onReact={onReact}
        />
      ))}
    </div>
  );
}

export function CommentThread({ comment, level = 0, onReply, onReact }: CommentThreadProps) {
  return (
    <CommentItem
      comment={comment}
      level={level}
      onReply={onReply}
      onReact={onReact}
    />
  );
}