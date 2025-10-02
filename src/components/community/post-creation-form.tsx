'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { mockUser } from '@/lib/mock-data';
import { 
  PaperClipIcon, 
  PhotoIcon, 
  LinkIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

interface PostCreationFormProps {
  channelId: string;
  onSubmit?: (content: string, attachments: File[]) => void;
  onCancel?: () => void;
  isExpanded?: boolean;
  onExpand?: () => void;
}

export function PostCreationForm({ 
  onSubmit, 
  onCancel, 
  isExpanded = false, 
  onExpand 
}: PostCreationFormProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit?.(content, attachments);
      setContent('');
      setAttachments([]);
      onCancel?.();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isExpanded) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mockUser.avatarUrl} alt={mockUser.username} />
              <AvatarFallback>{mockUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <button
              onClick={onExpand}
              className="flex-1 text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              What&apos;s on your mind, {mockUser.username}?
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create New Post</span>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={mockUser.avatarUrl} alt={mockUser.username} />
              <AvatarFallback>{mockUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, ask questions, or start a discussion..."
                  className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                
                {/* Rich text toolbar */}
                <div className="absolute bottom-2 left-2 flex items-center space-x-1">
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Format"
                  >
                    <Bars3Icon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <PaperClipIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <PhotoIcon className="h-4 w-4" />
                  <span>Photo</span>
                </div>
              </label>
              
              <button
                type="button"
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                <span>Link</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="min-w-[80px]"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}