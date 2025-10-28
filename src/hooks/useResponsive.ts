import { useState, useEffect } from 'react';
import { BREAKPOINTS, isMobileViewport, isTabletViewport, isDesktopViewport, isMobileDevice, isTouchDevice } from '../utils/responsive';

/**
 * Custom hook to detect current viewport size and device type
 * Updates on window resize
 *
 * @returns Object with viewport and device information
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [viewport, setViewport] = useState({
    isMobile: isMobileViewport(),
    isTablet: isTabletViewport(),
    isDesktop: isDesktopViewport(),
    isMobileOrTablet: window.innerWidth <= BREAKPOINTS.desktop,
  });

  const [device] = useState({
    isMobileDevice: isMobileDevice(),
    isTouchDevice: isTouchDevice(),
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });
      setViewport({
        isMobile: width <= BREAKPOINTS.mobile,
        isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.desktop,
        isDesktop: width > BREAKPOINTS.desktop,
        isMobileOrTablet: width <= BREAKPOINTS.desktop,
      });
    };

    // Use passive listener for better performance
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    ...windowSize,
    ...viewport,
    ...device,
    breakpoints: BREAKPOINTS,
  };
};

/**
 * Simpler hook that just returns if viewport is mobile size
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(isMobileViewport());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= BREAKPOINTS.mobile);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

/**
 * Hook that returns if viewport is mobile or tablet (not desktop)
 */
export const useIsMobileOrTablet = (): boolean => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(
    window.innerWidth <= BREAKPOINTS.desktop
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= BREAKPOINTS.desktop);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobileOrTablet;
};
