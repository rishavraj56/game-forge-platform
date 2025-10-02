'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { AuthLayout } from '@/components/layout/auth-layout';

const domainOptions = [
  { value: 'Game Development', label: 'Game Development' },
  { value: 'Game Design', label: 'Game Design' },
  { value: 'Game Art', label: 'Game Art' },
  { value: 'AI for Game Development', label: 'AI for Game Development' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Corporate', label: 'Corporate' }
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    domain: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.domain) {
      newErrors.domain = 'Please select your primary domain';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          domain: formData.domain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      // Registration successful - redirect to login
      window.location.href = '/auth/login?registered=true';
    } catch (error) {
      console.error('Registration failed:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed. This email or username may already be in use. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Join the Forge
          </CardTitle>
          <p className="text-gray-600 mt-2">Create your Game Forge account and start your journey</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Submit Error Alert */}
          {submitError && (
            <Alert variant="error" className="animate-in slide-in-from-top-2 duration-300">
              {submitError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleInputChange}
              error={errors.username}
              placeholder="Choose your unique username"
              helperText="3+ characters, letters, numbers, hyphens, and underscores only"
              autoComplete="username"
            />

            <Input
              type="email"
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter your email address"
              autoComplete="email"
            />

            <Select
              name="domain"
              label="Primary Domain"
              value={formData.domain}
              onChange={handleInputChange}
              error={errors.domain}
              options={domainOptions}
              placeholder="Select your primary domain"
              helperText="Choose the domain that best matches your expertise"
            />

            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              placeholder="Create a strong password"
              helperText="8+ characters with uppercase, lowercase, and numbers"
              showPasswordToggle={true}
              autoComplete="new-password"
            />

            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              showPasswordToggle={true}
              autoComplete="new-password"
            />

            {/* Terms and Privacy Notice */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              By creating an account, you agree to our Terms of Service and Privacy Policy. 
              We&apos;re committed to protecting your privacy and creating a safe community for all game developers.
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              loadingText="Creating Your Account..."
              size="lg"
            >
              Create My Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full" size="lg">
                Sign In Instead
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}