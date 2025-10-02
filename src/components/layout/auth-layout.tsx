import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 h-20 w-20 rounded-full bg-blue-200 opacity-20 blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 h-32 w-32 rounded-full bg-purple-200 opacity-20 blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 h-24 w-24 rounded-full bg-green-200 opacity-20 blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 h-16 w-16 rounded-full bg-orange-200 opacity-20 blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-indigo-200 opacity-10 blur-2xl animate-pulse delay-1500"></div>
      </div>

      {/* Header with Logo */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Game Forge</h1>
              <p className="text-xs text-gray-600">Unite. Create. Forge.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative flex items-center justify-center min-h-screen p-4 pt-24">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="text-center p-6">
          <p className="text-sm text-gray-500">
            © 2024 Game Forge. Empowering game developers worldwide.
          </p>
        </div>
      </div>
    </div>
  );
}