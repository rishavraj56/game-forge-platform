'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MotionPreferences, AccessibilityTesting } from '@/lib/accessibility';

interface AccessibilityContextType {
  prefersReducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    motionQuery.addEventListener('change', handleMotionChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    contrastQuery.addEventListener('change', handleContrastChange);

    // Load saved font size preference
    const savedFontSize = localStorage.getItem('accessibility-font-size') as 'small' | 'medium' | 'large' | null;
    if (savedFontSize) {
      setFontSizeState(savedFontSize);
      applyFontSize(savedFontSize);
    }

    // Run accessibility audit in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        AccessibilityTesting.logAuditResults();
      }, 2000);
    }

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('sr-announcements');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${size}`);
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
    applyFontSize(size);
    localStorage.setItem('accessibility-font-size', size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const value: AccessibilityContextType = {
    prefersReducedMotion,
    highContrast,
    fontSize,
    announceToScreenReader,
    setFontSize,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <div
        className={`
          ${prefersReducedMotion ? 'motion-reduce' : ''}
          ${highContrast ? 'high-contrast' : ''}
          font-${fontSize}
        `}
      >
        {children}
      </div>

      {/* Global accessibility styles */}
      <style jsx global>{`
        /* Font size variations */
        .font-small {
          font-size: 14px;
        }
        
        .font-medium {
          font-size: 16px;
        }
        
        .font-large {
          font-size: 18px;
        }

        /* High contrast mode */
        .high-contrast {
          --background: 0 0% 100%;
          --foreground: 0 0% 0%;
          --primary: 220 100% 50%;
          --primary-foreground: 0 0% 100%;
          --secondary: 0 0% 90%;
          --secondary-foreground: 0 0% 10%;
          --muted: 0 0% 95%;
          --muted-foreground: 0 0% 20%;
          --accent: 220 100% 50%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 100% 50%;
          --destructive-foreground: 0 0% 100%;
          --border: 0 0% 80%;
          --input: 0 0% 90%;
          --ring: 220 100% 50%;
        }

        /* Reduced motion */
        .motion-reduce * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        /* Enhanced focus indicators for high contrast */
        .high-contrast *:focus {
          outline: 3px solid currentColor;
          outline-offset: 2px;
        }

        /* Ensure minimum touch target sizes */
        button, 
        input[type="button"], 
        input[type="submit"], 
        input[type="reset"], 
        [role="button"], 
        [role="tab"], 
        [role="menuitem"] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Improve text readability */
        p, li, td, th {
          line-height: 1.6;
        }

        /* Ensure sufficient color contrast for links */
        a {
          text-decoration: underline;
        }

        a:hover, a:focus {
          text-decoration: none;
        }

        /* Better visibility for form validation */
        [aria-invalid="true"] {
          border-color: hsl(var(--destructive));
          box-shadow: 0 0 0 1px hsl(var(--destructive));
        }

        /* Loading states */
        [aria-busy="true"] {
          cursor: wait;
        }

        /* Disabled states */
        [aria-disabled="true"], 
        :disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Status indicators */
        [role="status"], 
        [role="alert"] {
          padding: 0.5rem;
          border-radius: 0.25rem;
        }

        [role="alert"] {
          background-color: hsl(var(--destructive) / 0.1);
          border: 1px solid hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
        }

        /* Improved table accessibility */
        table {
          border-collapse: collapse;
        }

        th {
          text-align: left;
          font-weight: 600;
        }

        th, td {
          padding: 0.75rem;
          border: 1px solid hsl(var(--border));
        }

        /* Better form field spacing */
        .form-field {
          margin-bottom: 1rem;
        }

        .form-field label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }

        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.25rem;
        }

        .form-field .error-message {
          color: hsl(var(--destructive));
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .form-field .help-text {
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
}