'use client';

import { useState } from 'react';
import { User, Domain } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';

interface ProfileEditFormProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => void;
  onCancel: () => void;
  className?: string;
}

const domains: Domain[] = [
  'Game Development',
  'Game Design',
  'Game Art',
  'AI for Game Development',
  'Creative',
  'Corporate'
];

export function ProfileEditForm({ user, onSave, onCancel, className }: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    domain: user.domain,
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image must be less than 5MB' }));
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, this would upload to a file storage service
      // For now, we'll create a local URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
      setErrors(prev => ({ ...prev, avatar: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, avatar: 'Failed to upload image' }));
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  return (
    <Card className={cn('p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Profile</h2>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {formData.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Change Picture'}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG up to 5MB
              </p>
            </div>
          </div>
          {errors.avatar && (
            <p className="text-red-600 text-sm mt-1">{errors.avatar}</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Username"
            error={errors.username}
            required
          >
            <Input
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter your username"
              className={errors.username ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField
            label="Email"
            error={errors.email}
            required
          >
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              className={errors.email ? 'border-red-500' : ''}
            />
          </FormField>
        </div>

        {/* Domain Selection */}
        <FormField
          label="Primary Domain"
          required
        >
          <Select
            value={formData.domain}
            onValueChange={(value) => handleInputChange('domain', value)}
            options={domains.map(domain => ({ value: domain, label: domain }))}
          />
        </FormField>

        {/* Bio */}
        <FormField
          label="Bio"
          error={errors.bio}
          description="Tell other members about yourself and your interests"
        >
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Write a brief bio about yourself..."
            rows={4}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
              errors.bio ? 'border-red-500' : ''
            )}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            <div></div>
            <span className="text-xs text-gray-500">
              {formData.bio.length}/500 characters
            </span>
          </div>
        </FormField>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}