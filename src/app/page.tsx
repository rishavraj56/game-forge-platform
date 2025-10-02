export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-8 h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Game Forge</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Unite with game developers across all disciplines. Learn, collaborate, and level up your skills through our gamified community platform.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/auth/register"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Join the Forge
            </a>
            <a
              href="/auth/login"
              className="rounded-lg border border-gray-300 px-8 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Community Hub</h3>
            <p className="text-gray-600">Connect with developers across six specialized domains and share knowledge.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Learning Academy</h3>
            <p className="text-gray-600">Access curated educational content and participate in mentorship programs.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">Gamification</h3>
            <p className="text-gray-600">Complete quests, earn XP, unlock badges, and climb the Forge Masters leaderboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}