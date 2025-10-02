'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { AuthLayout } from '@/components/layout/auth-layout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear errors when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Password reset requested for:', email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset failed:', error);
      setSubmitError('Failed to send reset email. Please check your email address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg animate-pulse">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Check Your Email
            </CardTitle>
            <p className="text-gray-600 mt-2">Password reset instructions have been sent</p>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <Alert variant="success" className="text-left">
              <div>
                <p className="font-medium mb-1">Reset link sent successfully!</p>
                <p className="text-sm">We&apos;ve sent a password reset link to <strong>{email}</strong></p>
              </div>
            </Alert>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Check your inbox and spam folder</p>
                <p>• The link will expire in 24 hours</p>
                <p>• If you don&apos;t receive it, you can request another</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                    setErrors({});
                    setSubmitError('');
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Try Different Email
                </Button>
                
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full" size="lg">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <p className="text-gray-600 mt-2">Enter your email to receive reset instructions</p>
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
              type="email"
              name="email"
              label="Email Address"
              value={email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter your registered email address"
              helperText="We&apos;ll send you a secure link to reset your password"
              autoComplete="email"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              loadingText="Sending Reset Link..."
              size="lg"
            >
              Send Reset Instructions
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Remember your password?</span>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full" size="lg">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}