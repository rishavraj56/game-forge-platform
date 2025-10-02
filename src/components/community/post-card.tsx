'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Post, Reaction } from '@/lib/types';
import { getUserById } from '@/lib/mock-data';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon,
  EllipsisHorizontalIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  FaceSmileIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/solid';

interface PostCardProps {
  post: Post;
  onReact?: (postId: string, reactionType: Reaction['type']) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  showComments?: boolean;
}

const reactionIcons = {
  like: HandThumbUpIcon,
  love: HeartIconSolid,
  laugh: FaceSmileIcon,
  wow: FaceSmileIcon,
  sad: FaceSmileIcon,
  angry: FaceSmileIcon
};

const reactionColors = {
  like: 'text-blue-500',
  love: 'text-red-500',
  laugh: 'text-yellow-500',
  wow: 'text-purple-500',
  sad: 'text-gray-500',
  angry: 'text-orange-500'
};

export function PostCard({ post, onReact, onComment, onShare, showComments = true }: PostCardProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [userReaction, setUserReaction] = useState<Reaction['type'] | null>(null);
  
  const author = getUserById(post.authorId);
  
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

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    post.reactions.forEach(reaction => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1;
    });
    return counts;
  };

  const getTotalReactions = () => {
    return post.reactions.length;
  };

  const handleReaction = (reactionType: Reaction['type']) => {
    setUserReaction(userReaction === reactionType ? null : reactionType);
    onReact?.(post.id, reactionType);
    setShowReactionPicker(false);
  };

  const renderAttachment = (attachment: { id: string; type: string; name: string; size?: number }) => {
    const iconMap = {
      image: PhotoIcon,
      file: DocumentIcon,
      link: LinkIcon
    };
    
    const Icon = iconMap[attachment.type as keyof typeof iconMap] || DocumentIcon;
    
    return (
      <div key={attachment.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
            {attachment.size && (
              <p className="text-xs text-gray-500">
                {(attachment.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const reactionCounts = getReactionCounts();
  const totalReactions = getTotalReactions();

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatarUrl} alt={author.username} />
              <AvatarFallback>{author.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{author.username}</h3>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600">{author.domain}</p>
            </div>
          </div>
          
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            {post.attachments.map(renderAttachment)}
          </div>
        )}

        {/* Reaction Summary */}
        {totalReactions > 0 && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1">
                {Object.entries(reactionCounts).slice(0, 3).map(([type]) => {
                  const Icon = reactionIcons[type as keyof typeof reactionIcons];
                  const colorClass = reactionColors[type as keyof typeof reactionColors];
                  return (
                    <div key={type} className="flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded-full">
                      <Icon className={`h-3 w-3 ${colorClass}`} />
                    </div>
                  );
                })}
              </div>
              <span className="text-sm text-gray-600">
                {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
              </span>
            </div>
            
            {showComments && (
              <button 
                onClick={() => onComment?.(post.id)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                12 comments
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Like Button with Reaction Picker */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                onMouseEnter={() => setShowReactionPicker(true)}
                className={`flex items-center space-x-2 ${
                  userReaction ? reactionColors[userReaction] : 'text-gray-600'
                } hover:bg-gray-100`}
              >
                {userReaction ? (
                  <>
                    {React.createElement(reactionIcons[userReaction], { className: 'h-4 w-4' })}
                    <span className="capitalize">{userReaction}</span>
                  </>
                ) : (
                  <>
                    <HeartIcon className="h-4 w-4" />
                    <span>React</span>
                  </>
                )}
              </Button>

              {/* Reaction Picker */}
              {showReactionPicker && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10"
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {Object.entries(reactionIcons).map(([type, Icon]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type as Reaction['type'])}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${reactionColors[type as keyof typeof reactionColors]}`}
                      title={type}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showComments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment?.(post.id)}
                className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100"
              >
                <ChatBubbleLeftIcon className="h-4 w-4" />
                <span>Comment</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare?.(post.id)}
              className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}