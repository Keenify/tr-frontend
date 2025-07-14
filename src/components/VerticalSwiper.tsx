import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Mousewheel, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
}

interface VerticalSwiperProps {
  slides: Slide[];
  autoplayDelay?: number;
  scrollSensitivity?: number;
}

const VerticalSwiper = ({ 
  slides, 
  autoplayDelay = 0, 
  scrollSensitivity = 1 
}: VerticalSwiperProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll-triggered navigation
  useEffect(() => {
    let accumulatedDelta = 0;
    const threshold = 50; // Scroll threshold to trigger slide change

    const handleWheel = (e: WheelEvent) => {
      if (!swiperRef.current || isScrolling) return;

      e.preventDefault();
      
      accumulatedDelta += e.deltaY * scrollSensitivity;

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a timeout to reset accumulated delta if no scrolling occurs
      scrollTimeoutRef.current = setTimeout(() => {
        accumulatedDelta = 0;
      }, 150);

      if (Math.abs(accumulatedDelta) >= threshold) {
        setIsScrolling(true);
        
        if (accumulatedDelta > 0) {
          // Scroll down - next slide
          swiperRef.current.slideNext();
        } else {
          // Scroll up - previous slide
          swiperRef.current.slidePrev();
        }
        
        accumulatedDelta = 0;
        
        // Re-enable scrolling after animation
        setTimeout(() => {
          setIsScrolling(false);
        }, 800);
      }
    };

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollSensitivity, isScrolling]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!swiperRef.current || isScrolling) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        swiperRef.current.slideNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        swiperRef.current.slidePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScrolling]);

  const goToSlide = (index: number) => {
    if (swiperRef.current && !isScrolling) {
      swiperRef.current.slideTo(index);
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
        speed={800}
        modules={[EffectFade, Mousewheel, Keyboard]}
        mousewheel={{
          enabled: true,
          forceToAxis: true,
          sensitivity: scrollSensitivity,
          thresholdDelta: 50,
        }}
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.activeIndex);
        }}
        className="w-full h-full"
        allowTouchMove={true}
        touchRatio={1}
        touchAngle={45}
        grabCursor={true}
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
              {/* Background overlay for better text readability */}
              {slide.backgroundImage && (
                <div className="absolute inset-0 bg-black/40"></div>
              )}
              
              {/* Content */}
              <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <h2 className="text-2xl md:text-3xl font-light mb-8 opacity-90">
                    {slide.subtitle}
                  </h2>
                )}
                <p className="text-xl md:text-2xl leading-relaxed opacity-80 max-w-3xl mx-auto">
                  {slide.content}
                </p>
              </div>

              {/* Slide indicator */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="text-sm opacity-60">
                  {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-white scale-125' 
                : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="fixed bottom-8 right-8 z-20 text-white/60 text-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-bounce">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5v14l7-7h-14l7 7z"/>
            </svg>
          </div>
          <span>Scroll to navigate</span>
        </div>
      </div>
    </div>
  );
};

export default VerticalSwiper;