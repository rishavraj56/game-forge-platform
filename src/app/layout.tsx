import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/contexts";
import { ErrorBoundary } from "@/components/ui/error-boundary";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Game Forge - Unite Game Developers",
  description: "A comprehensive community platform for game developers across all disciplines and skill levels.",
  keywords: "game development, community, developers, programming, design, art, AI",
  authors: [{ name: "Game Forge Team" }],
  creator: "Game Forge",
  publisher: "Game Forge",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gameforge.dev",
    title: "Game Forge - Unite Game Developers",
    description: "A comprehensive community platform for game developers across all disciplines and skill levels.",
    siteName: "Game Forge",
  },
  twitter: {
    card: "summary_large_image",
    title: "Game Forge - Unite Game Developers",
    description: "A comprehensive community platform for game developers across all disciplines and skill levels.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/geist-sans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Skip link for keyboard navigation */}
        <style jsx>{`
          .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 9999;
            transition: top 0.3s;
          }
          .skip-link:focus {
            top: 6px;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>

        {/* Screen reader announcements */}
        <div
          id="sr-announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        <ErrorBoundary>
          <AppProviders>
            <div className="flex min-h-screen flex-col">
              {children}
            </div>
          </AppProviders>
        </ErrorBoundary>

        {/* Focus indicator styles */}
        <style jsx global>{`
          /* Enhanced focus indicators */
          *:focus {
            outline: 2px solid hsl(var(--primary));
            outline-offset: 2px;
          }

          /* Remove default focus for mouse users */
          .js-focus-visible *:focus:not(.focus-visible) {
            outline: none;
          }

          /* Ensure focus is visible for keyboard users */
          .focus-visible {
            outline: 2px solid hsl(var(--primary)) !important;
            outline-offset: 2px !important;
          }

          /* High contrast mode support */
          @media (prefers-contrast: high) {
            * {
              border-color: ButtonText;
            }
            
            button, input, select, textarea {
              border: 1px solid ButtonText;
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }

          /* Screen reader only class */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }

          /* Focus visible when needed */
          .sr-only.focus:focus,
          .sr-only:focus {
            position: static;
            width: auto;
            height: auto;
            padding: inherit;
            margin: inherit;
            overflow: visible;
            clip: auto;
            white-space: inherit;
          }
        `}</style>

        {/* Focus management script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Add focus-visible polyfill behavior
              (function() {
                var hadKeyboardEvent = true;
                var keyboardThrottleTimeout = 100;
                var keyboardThrottleTimeoutID = 0;

                function onPointerDown() {
                  hadKeyboardEvent = false;
                }

                function onKeyDown(e) {
                  if (e.metaKey || e.altKey || e.ctrlKey) {
                    return;
                  }
                  hadKeyboardEvent = true;
                }

                function onFocus(e) {
                  if (hadKeyboardEvent || e.target.matches(':focus-visible')) {
                    e.target.classList.add('focus-visible');
                  }
                }

                function onBlur(e) {
                  e.target.classList.remove('focus-visible');
                }

                document.addEventListener('keydown', onKeyDown, true);
                document.addEventListener('mousedown', onPointerDown, true);
                document.addEventListener('pointerdown', onPointerDown, true);
                document.addEventListener('touchstart', onPointerDown, true);
                document.addEventListener('focus', onFocus, true);
                document.addEventListener('blur', onBlur, true);

                document.body.classList.add('js-focus-visible');
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
