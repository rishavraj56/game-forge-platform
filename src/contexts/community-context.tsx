'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Channel, Post, Comment, Domain } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from './auth-context';

interface CommunityState {
  channels: Channel[];
  posts: Post[];
  comments: Comment[];
  currentChannel: Channel | null;
  currentPost: Post | null;
  isLoading: boolean;
}

type CommunityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'SET_COMMENTS'; payload: Comment[] }
  | { type: 'SET_CURRENT_CHANNEL'; payload: Channel | null }
  | { type: 'SET_CURRENT_POST'; payload: Post | null }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: { id: string; updates: Partial<Post> } }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'UPDATE_COMMENT'; payload: { id: string; updates: Partial<Comment> } }
  | { type: 'DELETE_COMMENT'; payload: string }
  | { type: 'ADD_REACTION'; payload: { postId?: string; commentId?: string; reaction: any } }
  | { type: 'REMOVE_REACTION'; payload: { postId?: string; commentId?: string; reactionId: string } };

interface CommunityContextType extends CommunityState {
  loadChannels: () => Promise<void>;
  loadChannelPosts: (channelId: string) => Promise<void>;
  loadPostComments: (postId: string) => Promise<void>;
  setCurrentChannel: (channel: Channel | null) => void;
  setCurrentPost: (post: Post | null) => void;
  createPost: (channelId: string, content: string, attachments?: any[]) => Promise<Post>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<Comment>;
  updateComment: (commentId: string, updates: Partial<Comment>) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addReaction: (targetId: string, type: string, isPost?: boolean) => Promise<void>;
  removeReaction: (targetId: string, reactionId: string, isPost?: boolean) => Promise<void>;
  getChannelsByDomain: (domain: Domain) => Channel[];
  getPrimaryChannels: () => Channel[];
  getSubChannels: (parentId: string) => Channel[];
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const communityReducer = (state: CommunityState, action: CommunityAction): CommunityState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_CHANNELS':
      return {
        ...state,
        channels: action.payload,
      };
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload,
      };
    case 'SET_COMMENTS':
      return {
        ...state,
        comments: action.payload,
      };
    case 'SET_CURRENT_CHANNEL':
      return {
        ...state,
        currentChannel: action.payload,
      };
    case 'SET_CURRENT_POST':
      return {
        ...state,
        currentPost: action.payload,
      };
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
      };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id
            ? { ...post, ...action.payload.updates, updatedAt: new Date() }
            : post
        ),
        currentPost: state.currentPost?.id === action.payload.id
          ? { ...state.currentPost, ...action.payload.updates, updatedAt: new Date() }
          : state.currentPost,
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        currentPost: state.currentPost?.id === action.payload ? null : state.currentPost,
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload],
      };
    case 'UPDATE_COMMENT':
      return {
        ...state,
        comments: state.comments.map(comment =>
          comment.id === action.payload.id
            ? { ...comment, ...action.payload.updates, updatedAt: new Date() }
            : comment
        ),
      };
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter(comment => comment.id !== action.payload),
      };
    case 'ADD_REACTION':
      if (action.payload.postId) {
        return {
          ...state,
          posts: state.posts.map(post =>
            post.id === action.payload.postId
              ? { ...post, reactions: [...post.reactions, action.payload.reaction] }
              : post
          ),
        };
      } else if (action.payload.commentId) {
        return {
          ...state,
          comments: state.comments.map(comment =>
            comment.id === action.payload.commentId
              ? { ...comment, reactions: [...comment.reactions, action.payload.reaction] }
              : comment
          ),
        };
      }
      return state;
    case 'REMOVE_REACTION':
      if (action.payload.postId) {
        return {
          ...state,
          posts: state.posts.map(post =>
            post.id === action.payload.postId
              ? { 
                  ...post, 
                  reactions: post.reactions.filter(r => r.id !== action.payload.reactionId) 
                }
              : post
          ),
        };
      } else if (action.payload.commentId) {
        return {
          ...state,
          comments: state.comments.map(comment =>
            comment.id === action.payload.commentId
              ? { 
                  ...comment, 
                  reactions: comment.reactions.filter(r => r.id !== action.payload.reactionId) 
                }
              : comment
          ),
        };
      }
      return state;
    default:
      return state;
  }
};

const initialState: CommunityState = {
  channels: [],
  posts: [],
  comments: [],
  currentChannel: null,
  currentPost: null,
  isLoading: false,
};

interface CommunityProviderProps {
  children: ReactNode;
}

export function CommunityProvider({ children }: CommunityProviderProps) {
  const [state, dispatch] = useReducer(communityReducer, initialState);
  const { user } = useAuth();

  // Load initial channels
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const channelsResponse = await apiClient.getChannels();
        
        if (channelsResponse.success) {
          dispatch({ type: 'SET_CHANNELS', payload: channelsResponse.data?.channels || [] });
        }
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadChannels = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.getChannels();
      
      if (response.success) {
        dispatch({ type: 'SET_CHANNELS', payload: response.data?.channels || [] });
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadChannelPosts = async (channelId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.getChannelPosts(channelId);
      
      if (response.success) {
        dispatch({ type: 'SET_POSTS', payload: response.data?.posts || [] });
      }
    } catch (error) {
      console.error('Error loading channel posts:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadPostComments = async (postId: string): Promise<void> => {
    try {
      const response = await apiClient.getPostComments(postId);
      
      if (response.success) {
        dispatch({ type: 'SET_COMMENTS', payload: response.data?.comments || [] });
      }
    } catch (error) {
      console.error('Error loading post comments:', error);
    }
  };

  const setCurrentChannel = (channel: Channel | null) => {
    dispatch({ type: 'SET_CURRENT_CHANNEL', payload: channel });
  };

  const setCurrentPost = (post: Post | null) => {
    dispatch({ type: 'SET_CURRENT_POST', payload: post });
  };

  const createPost = async (channelId: string, content: string, attachments: any[] = []): Promise<Post> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await apiClient.createPost(channelId, content);
      
      if (response.success && response.data?.post) {
        const newPost = response.data.post;
        dispatch({ type: 'ADD_POST', payload: newPost });
        return newPost;
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch({ type: 'UPDATE_POST', payload: { id: postId, updates } });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const deletePost = async (postId: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      dispatch({ type: 'DELETE_POST', payload: postId });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const createComment = async (postId: string, content: string, parentId?: string): Promise<Comment> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await apiClient.createComment(postId, content);
      
      if (response.success && response.data?.comment) {
        const newComment = response.data.comment;
        dispatch({ type: 'ADD_COMMENT', payload: newComment });
        return newComment;
      } else {
        throw new Error('Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  const updateComment = async (commentId: string, updates: Partial<Comment>): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      dispatch({ type: 'UPDATE_COMMENT', payload: { id: commentId, updates } });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      dispatch({ type: 'DELETE_COMMENT', payload: commentId });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const addReaction = async (targetId: string, type: string, isPost: boolean = true): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const reaction = {
      id: `reaction-${Date.now()}`,
      userId: user.id,
      type: type as any,
      createdAt: new Date(),
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (isPost) {
        dispatch({ 
          type: 'ADD_REACTION', 
          payload: { postId: targetId, reaction } 
        });
      } else {
        dispatch({ 
          type: 'ADD_REACTION', 
          payload: { commentId: targetId, reaction } 
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  };

  const removeReaction = async (targetId: string, reactionId: string, isPost: boolean = true): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (isPost) {
        dispatch({ 
          type: 'REMOVE_REACTION', 
          payload: { postId: targetId, reactionId } 
        });
      } else {
        dispatch({ 
          type: 'REMOVE_REACTION', 
          payload: { commentId: targetId, reactionId } 
        });
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  };

  const value: CommunityContextType = {
    ...state,
    loadChannels,
    loadChannelPosts,
    loadPostComments,
    setCurrentChannel,
    setCurrentPost,
    createPost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
    getChannelsByDomain: (domain: Domain) => state.channels.filter(channel => channel.domain === domain),
    getPrimaryChannels: () => state.channels.filter(channel => channel.type === 'primary'),
    getSubChannels: (parentId: string) => state.channels.filter(channel => channel.type === 'sub' && channel.parent_id === parentId),
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity(): CommunityContextType {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}