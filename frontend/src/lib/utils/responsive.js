/**
 * Responsive utilities for the Banking System
 * Provides utilities for responsive design and breakpoint management
 */

import { breakpoints } from './design-tokens.js';

/**
 * Check if the current viewport matches a breakpoint
 * @param {string} breakpoint - Breakpoint name (sm, md, lg, xl, 2xl)
 * @returns {boolean} - Whether the viewport matches the breakpoint
 */
export function useBreakpoint(breakpoint) {
  if (typeof window === 'undefined') return false;
  
  const breakpointValue = breakpoints[breakpoint];
  if (!breakpointValue) return false;
  
  return window.matchMedia(`(min-width: ${breakpointValue})`).matches;
}

/**
 * Get the current breakpoint
 * @returns {string} - Current breakpoint name
 */
export function getCurrentBreakpoint() {
  if (typeof window === 'undefined') return 'sm';
  
  const width = window.innerWidth;
  
  if (width >= parseInt(breakpoints['2xl'])) return '2xl';
  if (width >= parseInt(breakpoints.xl)) return 'xl';
  if (width >= parseInt(breakpoints.lg)) return 'lg';
  if (width >= parseInt(breakpoints.md)) return 'md';
  return 'sm';
}

/**
 * Check if the current viewport is mobile
 * @returns {boolean} - Whether the viewport is mobile
 */
export function isMobile() {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(`(min-width: ${breakpoints.md})`).matches;
}

/**
 * Check if the current viewport is tablet
 * @returns {boolean} - Whether the viewport is tablet
 */
export function isTablet() {
  if (typeof window === 'undefined') return false;
  const mdMatches = window.matchMedia(`(min-width: ${breakpoints.md})`).matches;
  const lgMatches = window.matchMedia(`(min-width: ${breakpoints.lg})`).matches;
  return mdMatches && !lgMatches;
}

/**
 * Check if the current viewport is desktop
 * @returns {boolean} - Whether the viewport is desktop
 */
export function isDesktop() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${breakpoints.lg})`).matches;
}

/**
 * Responsive class generator
 * @param {object} classes - Object with breakpoint: className pairs
 * @returns {string} - Responsive class names
 */
export function responsive(classes) {
  const classNames = [];
  
  Object.entries(classes).forEach(([breakpoint, className]) => {
    if (breakpoint === 'base') {
      classNames.push(className);
    } else {
      classNames.push(`${breakpoint}:${className}`);
    }
  });
  
  return classNames.join(' ');
}

/**
 * Container classes for different layouts
 */
export const containerClasses = {
  // Full width container
  full: 'w-full',
  
  // Responsive container with max widths
  responsive: 'w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Narrow container for content
  narrow: 'w-full max-w-2xl mx-auto px-4 sm:px-6',
  
  // Wide container for dashboards
  wide: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Sidebar layout container
  sidebar: 'w-full max-w-screen-2xl mx-auto flex',
};

/**
 * Grid system utilities
 */
export const gridClasses = {
  // Responsive grid columns
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12',
  },
  
  // Gap utilities
  gap: {
    sm: 'gap-2 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  },
};

/**
 * Flex utilities for responsive layouts
 */
export const flexClasses = {
  // Responsive flex direction
  direction: {
    col: 'flex-col',
    colReverse: 'flex-col-reverse',
    row: 'flex-col md:flex-row',
    rowReverse: 'flex-col-reverse md:flex-row-reverse',
  },
  
  // Responsive alignment
  align: {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  },
  
  // Responsive justification
  justify: {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  },
};

/**
 * Typography responsive utilities
 */
export const typographyClasses = {
  // Responsive text sizes
  heading: {
    h1: 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold',
    h2: 'text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold',
    h3: 'text-lg md:text-xl lg:text-2xl font-semibold',
    h4: 'text-base md:text-lg lg:text-xl font-medium',
    h5: 'text-sm md:text-base lg:text-lg font-medium',
    h6: 'text-xs md:text-sm lg:text-base font-medium',
  },
  
  // Body text sizes
  body: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-sm md:text-base',
    lg: 'text-base md:text-lg',
  },
  
  // Responsive line heights
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
};

/**
 * Spacing utilities for responsive design
 */
export const spacingClasses = {
  // Responsive padding
  padding: {
    xs: 'p-2 md:p-3',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-12',
  },
  
  // Responsive margin
  margin: {
    xs: 'm-2 md:m-3',
    sm: 'm-3 md:m-4',
    md: 'm-4 md:m-6',
    lg: 'm-6 md:m-8',
    xl: 'm-8 md:m-12',
  },
  
  // Responsive gaps
  gap: {
    xs: 'gap-2 md:gap-3',
    sm: 'gap-3 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12',
  },
};