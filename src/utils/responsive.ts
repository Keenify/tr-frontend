/**
 * Responsive breakpoints for the application
 * Mobile-first approach
 */

export const BREAKPOINTS = {
  mobile: 640,      // 0-640px: Mobile phones
  tablet: 768,      // 641-768px: Large phones / Small tablets
  desktop: 1024,    // 769-1024px: Tablets
  wide: 1280,       // 1025-1280px: Desktop
  ultrawide: 1536,  // 1281px+: Large desktop
} as const;

/**
 * Media query strings for use in CSS-in-JS or styled components
 */
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `(min-width: ${BREAKPOINTS.mobile + 1}px) and (max-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop + 1}px)`,
  mobileAndTablet: `(max-width: ${BREAKPOINTS.desktop}px)`,
  tabletAndDesktop: `(min-width: ${BREAKPOINTS.mobile + 1}px)`,
} as const;

/**
 * Check if current viewport is mobile size
 */
export const isMobileViewport = (): boolean => {
  return window.innerWidth <= BREAKPOINTS.mobile;
};

/**
 * Check if current viewport is tablet size
 */
export const isTabletViewport = (): boolean => {
  return window.innerWidth > BREAKPOINTS.mobile && window.innerWidth <= BREAKPOINTS.desktop;
};

/**
 * Check if current viewport is desktop size
 */
export const isDesktopViewport = (): boolean => {
  return window.innerWidth > BREAKPOINTS.desktop;
};

/**
 * Check if current viewport is mobile or tablet (not desktop)
 */
export const isMobileOrTablet = (): boolean => {
  return window.innerWidth <= BREAKPOINTS.desktop;
};

/**
 * Detect if user is on a mobile device (based on user agent)
 * This is different from viewport size - detects actual device type
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for mobile patterns in user agent
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

/**
 * Detect if user is on a touch device
 */
export const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};
