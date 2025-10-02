'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './card';
import { Button } from './button';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { mockUser, mockLeaderboardUsers } from '@/lib/mock-data';
import { User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  domain: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'join' | 'leave';
}

interface LiveChatProps {
  channelId?: string;
  channelName?: string;
  maxMessages?: number;
  className?: string;
}

export function LiveChat({ 
  channelId = 'general', 
  channelName = 'General Chat',
  maxMessages = 50,
  className 
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      userId: '2',
      username: 'PixelMaster',
      avatarUrl: '/avatars/avatar-2.png',
      domain: 'Game Art',
      message: 'Just finished working on some new character designs! Anyone have feedback on stylized vs realistic approaches?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'message'
    },
    {
      id: 'msg-2',
      userId: '3',
      username: 'GameDesignGuru',
      avatarUrl: '/avatars/avatar-3.png',
      domain: 'Game Design',
      message: 'I think it depends on your target audience and game genre. What type of game are you working on?',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      type: 'message'
    },
    {
      id: 'msg-3',
      userId: '4',
      username: 'AIWizard',
      avatarUrl: '/avatars/avatar-4.png',
      domain: 'AI for Game Development',
      message: 'Has anyone experimented with AI-generated textures? I\'ve been playing with some interesting results.',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: 'message'
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<User[]>(mockLeaderboardUsers.slice(0, 8));
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate real-time messages and user activity
  useEffect(() => {
    if (!isConnected) return;

    const messageInterval = setInterval(() => {
      const shouldAddMessage = Math.random() > 0.8; // 20% chance every 10 seconds
      
      if (shouldAddMessage) {
        const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
        const sampleMessages = [
          'Great discussion everyone! 👍',
          'Anyone working on anything interesting this week?',
          'Just pushed a new update to my project!',
          'Looking for feedback on my latest prototype',
          'Thanks for the help earlier!',
          'Has anyone tried the new Unity features?',
          'Working late tonight on some challenging bugs 🐛',
          'Coffee break time! ☕',
          'Excited about the upcoming game jam!',
          'Just completed another quest! 🎉'
        ];
        
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          userId: randomUser.id,
          username: randomUser.username,
          avatarUrl: randomUser.avatarUrl,
          domain: randomUser.domain,
          message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
          timestamp: new Date(),
          type: 'message'
        };

        setMessages(prev => [...prev.slice(-(maxMessages - 1)), newMsg]);
      }
    }, 10000);

    // Simulate typing indicators
    const typingInterval = setInterval(() => {
      const shouldShowTyping = Math.random() > 0.9; // 10% chance
      
      if (shouldShowTyping) {
        const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
        setIsTyping(prev => [...prev, randomUser.username]);
        
        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setIsTyping(prev => prev.filter(user => user !== randomUser.username));
        }, 3000);
      }
    }, 5000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(typingInterval);
    };
  }, [isConnected, onlineUsers, maxMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: mockUser.id,
      username: mockUser.username,
      avatarUrl: mockUser.avatarUrl,
      domain: mockUser.domain,
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    setMessages(prev => [...prev.slice(-(maxMessages - 1)), message]);
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTypeIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'system':
        return (
          <div className="w-4 h-4 text-blue-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'join':
        return (
          <div className="w-4 h-4 text-green-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'leave':
        return (
          <div className="w-4 h-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">#{channelName}</h3>
            <div className={`flex items-center space-x-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {onlineUsers.length} online
            </span>
            <button
              onClick={() => setIsConnected(!isConnected)}
              className={`p-1 rounded transition-colors ${
                isConnected ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
              }`}
              title={isConnected ? 'Disconnect' : 'Connect'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            {message.type === 'message' ? (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.avatarUrl} alt={message.username} />
                  <AvatarFallback>{message.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {message.domain}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 break-words">
                    {message.message}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {getMessageTypeIcon(message.type)}
                <span>{message.message}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicators */}
        {isTyping.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {isTyping.length === 1 
                ? `${isTyping[0]} is typing...`
                : `${isTyping.slice(0, -1).join(', ')} and ${isTyping[isTyping.length - 1]} are typing...`
              }
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? `Message #${channelName}...` : 'Disconnected - cannot send messages'}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}