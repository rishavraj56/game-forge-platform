/**
 * Accessibility utilities and helpers
 */

// ARIA label generators
export const AriaLabels = {
  // Navigation
  navigation: {
    main: 'Main navigation',
    breadcrumb: 'Breadcrumb navigation',
    pagination: 'Pagination navigation',
    tabs: 'Tab navigation',
  },

  // Buttons and actions
  button: {
    close: 'Close',
    menu: 'Open menu',
    search: 'Search',
    filter: 'Filter results',
    sort: 'Sort options',
    expand: 'Expand section',
    collapse: 'Collapse section',
  },

  // Forms
  form: {
    required: 'Required field',
    optional: 'Optional field',
    error: 'Error message',
    help: 'Help text',
  },

  // Status and feedback
  status: {
    loading: 'Loading content',
    success: 'Success message',
    error: 'Error message',
    warning: 'Warning message',
    info: 'Information message',
  },

  // Gamification
  gamification: {
    xp: (amount: number) => `${amount} experience points`,
    level: (level: number) => `Level ${level}`,
    badge: (name: string) => `${name} badge`,
    quest: (name: string) => `${name} quest`,
    progress: (current: number, total: number) => `Progress: ${current} of ${total}`,
  },

  // Leaderboard
  leaderboard: {
    rank: (rank: number) => `Rank ${rank}`,
    user: (username: string, rank: number) => `${username}, ranked ${rank}`,
    filter: (domain: string) => `Filter by ${domain} domain`,
  },

  // Community
  community: {
    post: (author: string, time: string) => `Post by ${author} at ${time}`,
    comment: (author: string, time: string) => `Comment by ${author} at ${time}`,
    reaction: (type: string, count: number) => `${count} ${type} reactions`,
    channel: (name: string) => `${name} channel`,
  },
};

// Keyboard navigation helpers
export const KeyboardNavigation = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End',
  },

  // Handle keyboard navigation for lists
  handleListNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void
  ): number => {
    let newIndex = currentIndex;

    switch (event.key) {
      case KeyboardNavigation.keys.ARROW_UP:
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case KeyboardNavigation.keys.ARROW_DOWN:
        event.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case KeyboardNavigation.keys.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      case KeyboardNavigation.keys.END:
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case KeyboardNavigation.keys.ENTER:
      case KeyboardNavigation.keys.SPACE:
        event.preventDefault();
        if (onSelect) onSelect(currentIndex);
        return currentIndex;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  },

  // Handle tab navigation
  handleTabNavigation: (
    event: KeyboardEvent,
    tabs: HTMLElement[],
    currentIndex: number,
    onTabChange?: (index: number) => void
  ): number => {
    let newIndex = currentIndex;

    switch (event.key) {
      case KeyboardNavigation.keys.ARROW_LEFT:
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case KeyboardNavigation.keys.ARROW_RIGHT:
        event.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case KeyboardNavigation.keys.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      case KeyboardNavigation.keys.END:
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      case KeyboardNavigation.keys.ENTER:
      case KeyboardNavigation.keys.SPACE:
        event.preventDefault();
        if (onTabChange) onTabChange(currentIndex);
        return currentIndex;
    }

    if (newIndex !== currentIndex && tabs[newIndex]) {
      tabs[newIndex].focus();
      if (onTabChange) onTabChange(newIndex);
    }

    return newIndex;
  },
};

// Focus management
export const FocusManagement = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restore focus to previous element
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },

  // Get focusable elements
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  },
};

// Screen reader utilities
export const ScreenReader = {
  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Create visually hidden text for screen readers
  createSROnlyText: (text: string): HTMLSpanElement => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  },
};

// Color contrast utilities
export const ColorContrast = {
  // WCAG contrast ratios
  ratios: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3,
    AAA_NORMAL: 7,
    AAA_LARGE: 4.5,
  },

  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = ColorContrast.getLuminance(...color1);
    const lum2 = ColorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (
    color1: [number, number, number],
    color2: [number, number, number],
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
  ): boolean => {
    const ratio = ColorContrast.getContrastRatio(color1, color2);
    const required = level === 'AAA' 
      ? (size === 'large' ? ColorContrast.ratios.AAA_LARGE : ColorContrast.ratios.AAA_NORMAL)
      : (size === 'large' ? ColorContrast.ratios.AA_LARGE : ColorContrast.ratios.AA_NORMAL);
    
    return ratio >= required;
  },
};

// Motion and animation preferences
export const MotionPreferences = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Conditional animation classes
  getAnimationClass: (normalClass: string, reducedClass: string = ''): string => {
    return MotionPreferences.prefersReducedMotion() ? reducedClass : normalClass;
  },

  // Animation duration based on preference
  getAnimationDuration: (normalDuration: number): number => {
    return MotionPreferences.prefersReducedMotion() ? 0 : normalDuration;
  },
};

// Form accessibility helpers
export const FormAccessibility = {
  // Generate form field IDs and associations
  generateFieldIds: (fieldName: string) => ({
    field: `field-${fieldName}`,
    label: `label-${fieldName}`,
    error: `error-${fieldName}`,
    help: `help-${fieldName}`,
  }),

  // Create describedBy attribute
  createDescribedBy: (ids: string[]): string => {
    return ids.filter(Boolean).join(' ');
  },

  // Validation message helpers
  getValidationMessage: (field: string, error: string): string => {
    return `${field}: ${error}`;
  },
};

// Responsive design helpers
export const ResponsiveDesign = {
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Touch target sizes (minimum 44px for accessibility)
  touchTargets: {
    minimum: '44px',
    comfortable: '48px',
    large: '56px',
  },

  // Check if device is touch-enabled
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
};

// Accessibility testing helpers
export const AccessibilityTesting = {
  // Check for common accessibility issues
  auditPage: (): string[] => {
    const issues: string[] = [];

    // Check for images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent?.trim());
    if (buttonsWithoutText.length > 0) {
      issues.push(`${buttonsWithoutText.length} buttons without accessible names`);
    }

    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} form inputs without labels`);
    }

    // Check for headings hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push('Heading hierarchy skips levels');
        break;
      }
      previousLevel = level;
    }

    return issues;
  },

  // Log accessibility audit results
  logAuditResults: () => {
    const issues = AccessibilityTesting.auditPage();
    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
    } else {
      console.log('No accessibility issues detected');
    }
  },
};

export default {
  AriaLabels,
  KeyboardNavigation,
  FocusManagement,
  ScreenReader,
  ColorContrast,
  MotionPreferences,
  FormAccessibility,
  ResponsiveDesign,
  AccessibilityTesting,
};