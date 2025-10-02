'use client';

import React, { useState } from 'react';
import { PostCreationForm } from './post-creation-form';
import { PostCard } from './post-card';
import { CommentsSection } from './comments-section';
import { Post, Reaction } from '@/lib/types';
import { getPostsByChannelId } from '@/lib/mock-data';

interface DiscussionFeedProps {
  channelId: string;
  showPostCreation?: boolean;
}

export function DiscussionFeed({ channelId, showPostCreation = true }: DiscussionFeedProps) {
  const [posts, setPosts] = useState<Post[]>(getPostsByChannelId(channelId));
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleCreatePost = (content: string, attachments: File[]) => {
    // In a real app, this would make an API call
    console.log('Creating post:', { content, attachments, channelId });
    
    // Simulate adding the new post
    const newPost: Post = {
      id: `post-${Date.now()}`,
      channelId,
      authorId: '1', // Current user
      content,
      attachments: [], // Would handle file uploads in real implementation
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setPosts(prev => [newPost, ...prev]);
  };

  const handleReactToPost = (postId: string, reactionType: Reaction['type']) => {
    console.log('Reacting to post:', { postId, reactionType });
    // In a real app, this would make an API call to add/remove reaction
  };

  const handleCommentOnPost = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSharePost = (postId: string) => {
    console.log('Sharing post:', postId);
    // In a real app, this would open a share dialog or copy link
  };

  const handleAddComment = (postId: string, content: string) => {
    console.log('Adding comment:', { postId, content });
    // In a real app, this would make an API call
  };

  const handleReplyToComment = (commentId: string, content: string) => {
    console.log('Replying to comment:', { commentId, content });
    // In a real app, this would make an API call
  };

  const handleReactToComment = (commentId: string, reactionType: Reaction['type']) => {
    console.log('Reacting to comment:', { commentId, reactionType });
    // In a real app, this would make an API call
  };

  return (
    <div className="space-y-6">
      {/* Post Creation */}
      {showPostCreation && (
        <PostCreationForm
          channelId={channelId}
          onSubmit={handleCreatePost}
          onCancel={() => setShowCreatePost(false)}
          isExpanded={showCreatePost}
          onExpand={() => setShowCreatePost(true)}
        />
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-500 mb-4">Be the first to start a conversation in this channel!</p>
            {showPostCreation && !showCreatePost && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id}>
              <PostCard
                post={post}
                onReact={handleReactToPost}
                onComment={handleCommentOnPost}
                onShare={handleSharePost}
              />
              
              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <CommentsSection
                  postId={post.id}
                  onAddComment={handleAddComment}
                  onReplyToComment={handleReplyToComment}
                  onReactToComment={handleReactToComment}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}