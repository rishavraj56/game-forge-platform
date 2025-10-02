import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <span className="text-xl font-bold text-gray-900">Game Forge</span>
            </div>
            <p className="text-sm text-gray-600">
              Uniting game developers across all disciplines through collaboration, learning, and gamified engagement.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/main-anvil" className="hover:text-gray-900 transition-colors">
                  Main Anvil
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-gray-900 transition-colors">
                  Community Hub
                </Link>
              </li>
              <li>
                <Link href="/academy" className="hover:text-gray-900 transition-colors">
                  The Academy
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-gray-900 transition-colors">
                  Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Domains */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Domains</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/community/game-development" className="hover:text-gray-900 transition-colors">
                  Game Development
                </Link>
              </li>
              <li>
                <Link href="/community/game-design" className="hover:text-gray-900 transition-colors">
                  Game Design
                </Link>
              </li>
              <li>
                <Link href="/community/game-art" className="hover:text-gray-900 transition-colors">
                  Game Art
                </Link>
              </li>
              <li>
                <Link href="/community/ai-for-games" className="hover:text-gray-900 transition-colors">
                  AI for Games
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="hover:text-gray-900 transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-gray-600">
              © 2025 Game Forge. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">Discord</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.942 4.556a16.3 16.3 0 0 0-4.126-1.3 12.04 12.04 0 0 0-.529 1.1 15.175 15.175 0 0 0-4.573 0 11.585 11.585 0 0 0-.535-1.1 16.274 16.274 0 0 0-4.129 1.3A17.392 17.392 0 0 0 .182 13.218a15.785 15.785 0 0 0 4.963 2.521c.41-.564.773-1.16 1.084-1.785a10.63 10.63 0 0 1-1.706-.83c.143-.106.283-.217.418-.33a11.664 11.664 0 0 0 10.118 0c.137.113.277.224.418.33-.544.328-1.116.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595 17.286 17.286 0 0 0-2.973-8.662zM6.678 10.813a1.941 1.941 0 0 1-1.8-2.045 1.93 1.93 0 0 1 1.8-2.047 1.919 1.919 0 0 1 1.8 2.047 1.93 1.93 0 0 1-1.8 2.045zm6.644 0a1.94 1.94 0 0 1-1.8-2.045 1.93 1.93 0 0 1 1.8-2.047 1.918 1.918 0 0 1 1.8 2.047 1.93 1.93 0 0 1-1.8 2.045z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}