import { useEffect, useRef, useState, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Mousewheel, Keyboard, Parallax } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/parallax';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  overlay?: string;
}

interface AdvancedVerticalSwiperProps {
  slides: Slide[];
  autoplayDelay?: number;
  scrollSensitivity?: number;
  animationSpeed?: number;
  enableParallax?: boolean;
  enableProgress?: boolean;
}

const AdvancedVerticalSwiper = ({ 
  slides, 
  autoplayDelay = 0, 
  scrollSensitivity = 1,
  animationSpeed = 1000,
  enableParallax = true,
  enableProgress = true
}: AdvancedVerticalSwiperProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Enhanced scroll handling with momentum and easing
  const handleScroll = useCallback((e: WheelEvent) => {
    if (!swiperRef.current || isScrolling) return;

    e.preventDefault();
    
    const delta = e.deltaY;
    const threshold = 100;

    if (Math.abs(delta) >= threshold) {
      setIsScrolling(true);
      
      if (delta > 0) {
        swiperRef.current.slideNext();
      } else {
        swiperRef.current.slidePrev();
      }
      
      setTimeout(() => {
        setIsScrolling(false);
      }, animationSpeed);
    }
  }, [isScrolling, animationSpeed]);

  // Touch handling for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartY.current || !swiperRef.current || isScrolling) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;
    const threshold = 50;

    if (Math.abs(diffY) >= threshold) {
      setIsScrolling(true);
      
      if (diffY > 0) {
        swiperRef.current.slideNext();
      } else {
        swiperRef.current.slidePrev();
      }
      
      setTimeout(() => {
        setIsScrolling(false);
      }, animationSpeed);
    }

    touchStartY.current = null;
  }, [isScrolling, animationSpeed]);

  // Setup event listeners
  useEffect(() => {
    const element = document.documentElement;
    
    element.addEventListener('wheel', handleScroll, { passive: false });
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('wheel', handleScroll);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, handleTouchStart, handleTouchEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!swiperRef.current || isScrolling) return;

      let shouldPreventDefault = false;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        shouldPreventDefault = true;
        swiperRef.current.slideNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        shouldPreventDefault = true;
        swiperRef.current.slidePrev();
      } else if (e.key === 'Home') {
        shouldPreventDefault = true;
        swiperRef.current.slideTo(0);
      } else if (e.key === 'End') {
        shouldPreventDefault = true;
        swiperRef.current.slideTo(slides.length - 1);
      }

      if (shouldPreventDefault) {
        e.preventDefault();
        setIsScrolling(true);
        setTimeout(() => setIsScrolling(false), animationSpeed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScrolling, animationSpeed, slides.length]);

  const goToSlide = (index: number) => {
    if (swiperRef.current && !isScrolling) {
      setIsScrolling(true);
      swiperRef.current.slideTo(index);
      setTimeout(() => setIsScrolling(false), animationSpeed);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        direction="vertical"
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        speed={animationSpeed}
        parallax={enableParallax}
        modules={[EffectFade, Mousewheel, Keyboard, Parallax]}
        mousewheel={{
          enabled: false, // We handle this manually for better control
        }}
        keyboard={{
          enabled: false, // We handle this manually
        }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.activeIndex);
          setProgress((swiper.activeIndex + 1) / slides.length * 100);
        }}
        className="w-full h-full"
        allowTouchMove={false} // We handle touch manually
        resistance={false}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id} className="relative w-full h-full">
            <div
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: slide.backgroundColor,
                color: slide.textColor,
                backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Parallax background layer */}
              {enableParallax && slide.backgroundImage && (
                <div 
                  className="absolute inset-0 w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%]"
                  data-swiper-parallax="-23%"
                  style={{
                    backgroundImage: `url(${slide.backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )}
              
              {/* Background overlay */}
              {slide.backgroundImage && (
                <div 
                  className={`absolute inset-0 ${slide.overlay || 'bg-black/50'}`}
                  data-swiper-parallax="-10%"
                />
              )}
              
              {/* Content with parallax */}
              <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                <h1 
                  className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                  data-swiper-parallax="-300"
                >
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <h2 
                    className="text-2xl md:text-3xl font-light mb-8 opacity-90"
                    data-swiper-parallax="-200"
                  >
                    {slide.subtitle}
                  </h2>
                )}
                <p 
                  className="text-xl md:text-2xl leading-relaxed opacity-80 max-w-3xl mx-auto"
                  data-swiper-parallax="-100"
                >
                  {slide.content}
                </p>
              </div>

              {/* Slide indicator */}
              <div 
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                data-swiper-parallax="-50"
              >
                <div className="text-sm opacity-60 font-mono">
                  {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isScrolling}
            className={`relative w-4 h-4 rounded-full transition-all duration-500 disabled:cursor-not-allowed ${
              index === activeIndex 
                ? 'bg-white scale-125 shadow-lg' 
                : 'bg-white/30 hover:bg-white/60 hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === activeIndex && (
              <div className="absolute inset-0 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {enableProgress && (
        <div className="fixed top-0 left-0 w-full h-1 bg-black/20 z-30">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Enhanced scroll hint */}
      <div className="fixed bottom-8 right-8 z-20 text-white/60 text-sm">
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            <div className="animate-bounce">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </div>
            <span>Scroll to navigate</span>
          </div>
          <div className="text-xs opacity-40">
            Use ↑↓ keys, wheel, or touch
          </div>
        </div>
      </div>

      {/* Loading overlay during transitions */}
      {isScrolling && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-black/10" />
        </div>
      )}
    </div>
  );
};

export default AdvancedVerticalSwiper;