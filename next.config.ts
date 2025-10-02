import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'date-fns'],
    // Note: PPR (Partial Prerendering) requires Next.js canary version
    // ppr: true, // Disabled for stable Next.js version compatibility
  },

  // Compression and optimization
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        }))()
      );
      return config;
    },
  }),

  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/leaderboards/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
          },
        ],
      },
      {
        source: '/api/gamification/badges/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200', // 1 hour cache, 2 hour stale
          },
        ],
      },
      {
        source: '/api/academy/modules/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
          },
        ],
      },
      {
        source: '/api/domains/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=7200, stale-while-revalidate=14400', // 2 hour cache, 4 hour stale
          },
        ],
      },
      // Static assets caching
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
