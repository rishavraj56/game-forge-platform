/**
 * Animation and transition utilities with accessibility support
 */

import { MotionPreferences } from './accessibility';

// Animation presets
export const AnimationPresets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  scaleInCenter: {
    initial: { opacity: 0, scale: 0.8, transformOrigin: 'center' },
    animate: { opacity: 1, scale: 1, transformOrigin: 'center' },
    exit: { opacity: 0, scale: 0.8, transformOrigin: 'center' },
  },

  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  },

  slideInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  },

  // Bounce animation
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }
    },
    exit: { opacity: 0, scale: 0.3 },
  },

  // Rotation animations
  rotateIn: {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 },
  },
};

// Transition configurations
export const TransitionConfig = {
  // Standard easing
  easeInOut: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },

  // Quick transitions
  quick: {
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1],
  },

  // Smooth transitions
  smooth: {
    duration: 0.4,
    ease: [0.25, 0.46, 0.45, 0.94],
  },

  // Bouncy transitions
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },

  // Gentle spring
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  },
};

// Stagger configurations
export const StaggerConfig = {
  container: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },

  fastStagger: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
  },
};

// Micro-interactions
export const MicroInteractions = {
  // Button hover effects
  buttonHover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },

  buttonTap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },

  // Card hover effects
  cardHover: {
    y: -4,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.3 },
  },

  // Icon animations
  iconSpin: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },

  iconBounce: {
    y: [0, -10, 0],
    transition: { duration: 0.6, repeat: Infinity },
  },

  iconPulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 1, repeat: Infinity },
  },

  // Loading animations
  loadingDots: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  loadingSpinner: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },

  // Progress animations
  progressBar: {
    scaleX: [0, 1],
    transformOrigin: 'left',
    transition: { duration: 0.8, ease: 'easeOut' },
  },

  // Notification animations
  notificationSlide: {
    x: [300, 0],
    opacity: [0, 1],
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  notificationExit: {
    x: 300,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// Accessibility-aware animation helper
export function getAccessibleAnimation<T>(animation: T): T | {} {
  return MotionPreferences.prefersReducedMotion() ? {} : animation;
}

// Duration helper with accessibility support
export function getAnimationDuration(duration: number): number {
  return MotionPreferences.getAnimationDuration(duration);
}

// CSS class helpers for animations
export const AnimationClasses = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Slide animations
  slideInFromTop: 'animate-in slide-in-from-top-2 duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left-2 duration-300',
  slideInFromRight: 'animate-in slide-in-from-right-2 duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-200',
  
  // Combined animations
  fadeInUp: 'animate-in fade-in slide-in-from-bottom-2 duration-300',
  fadeInDown: 'animate-in fade-in slide-in-from-top-2 duration-300',
  
  // Hover effects
  hoverScale: 'transition-transform hover:scale-105 duration-200',
  hoverLift: 'transition-transform hover:-translate-y-1 duration-200',
  
  // Focus effects
  focusRing: 'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
  
  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
};

// Responsive animation classes
export const ResponsiveAnimations = {
  // Only animate on larger screens
  desktopOnly: 'md:animate-in md:fade-in md:slide-in-from-bottom-2 md:duration-300',
  
  // Reduced animations on mobile
  mobileReduced: 'animate-in fade-in duration-150 md:slide-in-from-bottom-2 md:duration-300',
  
  // Touch-friendly animations
  touchFriendly: 'active:scale-95 transition-transform duration-100',
};

// Animation utility functions
export const AnimationUtils = {
  // Create staggered animation delays
  createStaggerDelay: (index: number, baseDelay: number = 100): string => {
    return `animation-delay: ${index * baseDelay}ms;`;
  },

  // Get animation class with reduced motion support
  getAnimationClass: (normalClass: string, reducedClass: string = ''): string => {
    return MotionPreferences.prefersReducedMotion() ? reducedClass : normalClass;
  },

  // Create CSS custom properties for animations
  createAnimationVars: (duration: number, delay: number = 0, easing: string = 'ease-out') => ({
    '--animation-duration': `${getAnimationDuration(duration)}ms`,
    '--animation-delay': `${delay}ms`,
    '--animation-easing': easing,
  }),

  // Intersection Observer for scroll animations
  createScrollAnimation: (
    element: HTMLElement,
    animationClass: string,
    threshold: number = 0.1
  ): IntersectionObserver => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animationClass);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    return observer;
  },
};

// Performance optimization for animations
export const AnimationPerformance = {
  // Use transform and opacity for better performance
  optimizedProperties: ['transform', 'opacity'],

  // Will-change optimization
  willChange: {
    transform: 'will-change-transform',
    opacity: 'will-change-opacity',
    auto: 'will-change-auto',
  },

  // GPU acceleration
  gpuAcceleration: 'transform-gpu',

  // Contain layout shifts
  containLayout: 'contain-layout contain-style',
};

export default {
  AnimationPresets,
  TransitionConfig,
  StaggerConfig,
  MicroInteractions,
  AnimationClasses,
  ResponsiveAnimations,
  AnimationUtils,
  AnimationPerformance,
  getAccessibleAnimation,
  getAnimationDuration,
};