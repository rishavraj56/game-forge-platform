/**
 * Bundle optimization utilities and dynamic imports
 */

// Lazy load heavy components (examples - update paths as components are created)
export const LazyComponents = {
  // Admin components (only loaded when needed)
  // AdminDashboard: () => import('../components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })),
  // AdminUserManagement: () => import('../components/admin/AdminUserManagement').then(m => ({ default: m.AdminUserManagement })),
  // AdminAnalytics: () => import('../components/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })),

  // Learning components (heavy content)
  // LearningModuleViewer: () => import('../components/academy/LearningModuleViewer').then(m => ({ default: m.LearningModuleViewer })),
  // RichTextEditor: () => import('../components/community/RichTextEditor').then(m => ({ default: m.RichTextEditor })),

  // Charts and visualizations
  // LeaderboardChart: () => import('../components/leaderboard/LeaderboardChart').then(m => ({ default: m.LeaderboardChart })),
  // AnalyticsChart: () => import('../components/admin/AnalyticsChart').then(m => ({ default: m.AnalyticsChart })),

  // Event management (complex forms)
  // EventCreationForm: () => import('../components/events/EventCreationForm').then(m => ({ default: m.EventCreationForm })),
  // EventManagement: () => import('../components/events/EventManagement').then(m => ({ default: m.EventManagement })),
};

// Preload critical components
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload components that are likely to be needed soon (update paths as components are created)
    const criticalComponents: (() => Promise<any>)[] = [
      // () => import('../components/gamification/QuestCard'),
      // () => import('../components/leaderboard/LeaderboardWidget'),
      // () => import('../components/notifications/NotificationCenter'),
    ];

    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = (fn: () => Promise<any>) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => fn().catch(() => { }));
      } else {
        setTimeout(() => fn().catch(() => { }), 100);
      }
    };

    criticalComponents.forEach(schedulePreload);
  }
};

// Code splitting by route (examples - update paths as pages are created)
export const RouteComponents = {
  // Main pages (uncomment as pages are created)
  // Dashboard: () => import('../app/main-anvil/page').then(m => ({ default: m.default })),
  // Leaderboard: () => import('../app/leaderboard/page').then(m => ({ default: m.default })),
  // Community: () => import('../app/community/page').then(m => ({ default: m.default })),
  // Academy: () => import('../app/academy/page').then(m => ({ default: m.default })),
  // Events: () => import('../app/events/page').then(m => ({ default: m.default })),
  // Profile: () => import('../app/profile/page').then(m => ({ default: m.default })),

  // Admin routes
  // AdminDashboard: () => import('../app/admin/page').then(m => ({ default: m.default })),
  // DomainLeadDashboard: () => import('../app/domain-lead/page').then(m => ({ default: m.default })),
};

// Optimize images
export const ImageOptimization = {
  // Lazy loading configuration
  lazyLoadConfig: {
    rootMargin: '50px',
    threshold: 0.1,
  },

  // Image size presets
  sizes: {
    avatar: '(max-width: 768px) 40px, 48px',
    thumbnail: '(max-width: 768px) 150px, 200px',
    hero: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    fullWidth: '100vw',
  },

  // Placeholder generation
  generatePlaceholder: (width: number, height: number) => {
    return `data:image/svg+xml;base64,${btoa(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui">
          Loading...
        </text>
      </svg>`
    )}`;
  },
};

// Font optimization
export const FontOptimization = {
  // Preload critical fonts
  preloadFonts: () => {
    if (typeof document !== 'undefined') {
      const fontPreloads = [
        { href: '/fonts/inter-var.woff2', type: 'font/woff2' },
      ];

      fontPreloads.forEach(({ href, type }) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = type;
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    }
  },

  // Font display optimization
  fontDisplay: 'swap' as const,
};

// Service Worker for caching
export const ServiceWorkerConfig = {
  // Cache strategies
  cacheStrategies: {
    // Static assets - cache first
    static: {
      pattern: /\.(js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/,
      strategy: 'CacheFirst',
      cacheName: 'static-assets',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // API responses - network first with cache fallback
    api: {
      pattern: /^\/api\//,
      strategy: 'NetworkFirst',
      cacheName: 'api-cache',
      maxAge: 5 * 60, // 5 minutes
    },

    // Pages - stale while revalidate
    pages: {
      pattern: /^\/(?!api)/,
      strategy: 'StaleWhileRevalidate',
      cacheName: 'pages',
      maxAge: 24 * 60 * 60, // 24 hours
    },
  },

  // Runtime caching
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
};

// Performance budgets
export const PerformanceBudgets = {
  // Bundle size limits
  bundles: {
    main: 250 * 1024, // 250KB
    vendor: 500 * 1024, // 500KB
    async: 100 * 1024, // 100KB per async chunk
  },

  // Asset size limits
  assets: {
    image: 500 * 1024, // 500KB per image
    font: 100 * 1024, // 100KB per font
    total: 2 * 1024 * 1024, // 2MB total
  },

  // Performance metrics
  metrics: {
    fcp: 1500, // First Contentful Paint - 1.5s
    lcp: 2500, // Largest Contentful Paint - 2.5s
    fid: 100, // First Input Delay - 100ms
    cls: 0.1, // Cumulative Layout Shift - 0.1
    ttfb: 600, // Time to First Byte - 600ms
  },
};

// Tree shaking helpers
export const TreeShakingHelpers = {
  // Import only what's needed from libraries
  lodashImports: {
    // Instead of: import _ from 'lodash'
    // Use: import { debounce, throttle } from 'lodash-es'
    recommended: [
      'debounce',
      'throttle',
      'cloneDeep',
      'isEqual',
      'merge',
    ],
  },

  // Date-fns imports
  dateFnsImports: {
    // Instead of: import * as dateFns from 'date-fns'
    // Use specific imports
    recommended: [
      'format',
      'parseISO',
      'isAfter',
      'isBefore',
      'addDays',
      'subDays',
      'startOfWeek',
      'endOfWeek',
    ],
  },

  // Icon imports
  iconImports: {
    // Instead of: import * as Icons from '@heroicons/react/24/outline'
    // Use specific imports
    example: `
      import { 
        HomeIcon,
        UserIcon,
        CogIcon 
      } from '@heroicons/react/24/outline';
    `,
  },
};

// Webpack optimization hints
export const WebpackOptimizations = {
  // Split chunks configuration
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
      },
      icons: {
        test: /[\\/]node_modules[\\/]@heroicons[\\/]/,
        name: 'icons',
        chunks: 'all',
        priority: 15,
      },
    },
  },

  // Module concatenation
  optimization: {
    concatenateModules: true,
    usedExports: true,
    sideEffects: false,
  },
};

export default {
  LazyComponents,
  RouteComponents,
  ImageOptimization,
  FontOptimization,
  ServiceWorkerConfig,
  PerformanceBudgets,
  TreeShakingHelpers,
  WebpackOptimizations,
  preloadCriticalComponents,
};