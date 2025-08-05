import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

// Custom hook for scroll-triggered animations
const useScrollAnimation = (triggerOnce = true) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [triggerOnce]);

  return [elementRef, isVisible] as const;
};

// Media Display Component to handle both images and videos
const MediaDisplay = ({ media, className, alt }: { 
  media: { type: string; src: string }, 
  className: string, 
  alt: string 
}) => {
  if (media.type === "video") {
    return (
      <video 
        src={media.src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onError={(e) => {
          console.error('Video loading error:', e);
        }}
        style={{ 
          objectFit: 'cover', 
          width: '100%', 
          height: '100%', 
          position: 'relative', 
          zIndex: 2,
          backgroundColor: 'black'
        }}
      />
    );
  }
  
  // For both "image" and "gif" types
  return (
    <img 
      src={media.src}
      alt={alt}
      className={className}
      style={{ 
        objectFit: 'cover', 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        zIndex: 2 
      }}
    />
  );
};

const ModulesShowcase = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  
  // Scroll animation hooks
  const [titleRef, titleVisible] = useScrollAnimation();
  const [subtitleRef, subtitleVisible] = useScrollAnimation();

  const modules = [
    { 
      name: "Daily Journal", 
      description: "Record your thoughts and reflections with guided prompts",
      detailedDescription: "Transform your daily routine with our comprehensive journaling system. Features guided prompts, mood tracking, gratitude exercises, and reflection spaces to help you process your thoughts and emotions. Build a consistent writing habit that promotes self-awareness and personal growth.",
      url: "/journaling",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/1. Daily Journal.mp4"
        }
      ]
    },
    { 
      name: "Weekly Rhythm", 
      description: "Plan and review your weekly priorities and goals",
      detailedDescription: "Establish a powerful weekly planning system that helps you stay focused on what matters most. Set intentions, track progress, and reflect on your achievements. Perfect for busy professionals who want to maintain work-life balance while achieving their goals.",
      url: "/weekly-rhythms",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/2. Weekly Rhythms.mp4"
        }
      ]
    },
    { 
      name: "Annual Calendar Plans", 
      description: "Strategic yearly planning with comprehensive goal setting and milestone tracking for long-term success",
      detailedDescription: "Master your annual planning with our comprehensive calendar system. Set strategic goals, plan major milestones, and track your progress throughout the year. Perfect for executives and professionals who need to align daily actions with long-term vision and objectives.",
      url: "/annual_calendar_plans",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/3. Annual Calendar Plans.mp4"
        }
      ]
    },
    { 
      name: "Habit Tracker", 
      description: "Track your daily habits and build consistency",
      detailedDescription: "Build lasting positive habits with our intuitive tracking system. Monitor your progress, identify patterns, and celebrate streaks. Features customizable habits, visual progress indicators, and insights to help you understand your behavior patterns.",
      url: "/habit-tracker",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/4. Habit Tracker.mp4"
        }
      ]
    },
    { 
      name: "To-do List", 
      description: "A simple and easy-to-use to-do list, like a piece of paper",
      detailedDescription: "Experience the simplicity of a digital to-do list that feels as natural as pen and paper. Quickly capture tasks, set priorities, and check off completed items. Perfect for those who prefer minimalist productivity tools without overwhelming features.",
      url: "/todo",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/5. To-Do List.mp4"
        }
      ]
    },
    { 
      name: "Weekly Design System", 
      description: "Plan and track your weekly activities with a design focus",
      detailedDescription: "Structure your creative projects with our design sprint methodology. Break down complex projects into manageable weekly sprints, track deliverables, and maintain momentum on your creative endeavors. Ideal for designers, developers, and creative professionals.",
      url: "/weekly-design-system",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/6. Weekly Design System.mp4"
        }
      ]
    },
    { 
      name: "Project Management", 
      description: "Organize and track your projects from start to finish",
      detailedDescription: "Comprehensive project management tools to keep your initiatives on track. Features include milestone tracking, deadline management, resource allocation, and progress visualization. Perfect for managing multiple projects simultaneously with an intuitive sidebar navigation and clean interface.",
      url: "/project",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/7. Project Management.mp4"
        }
      ]
    },
    { 
      name: "Personal Finance", 
      description: "Track income, expenses, and manage your budget",
      detailedDescription: "Take control of your financial future with comprehensive budget tracking and expense management. Monitor income streams, categorize expenses, set savings goals, and visualize your financial health with intuitive charts and reports.",
      url: "/personal-finance",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/8. Personal Finance.mp4"
        }
      ]
    },
    { 
      name: "Bucket List", 
      description: "Create and manage your life goals and dreams",
      detailedDescription: "Turn your dreams into actionable plans with our bucket list manager. Categorize goals by timeline, track progress, add photos and memories, and celebrate achievements. Perfect for maintaining motivation and focus on your life aspirations.",
      url: "/bucket-list",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/9. Bucket List.mp4"
        }
      ]
    },
    { 
      name: "Manifestation", 
      description: "Set intentions and track your manifestation journey",
      detailedDescription: "Harness the power of intention setting with our manifestation tracker. Visualize your goals, track synchronicities, practice gratitude, and monitor your progress toward your desires. Includes guided exercises and reflection prompts.",
      url: "/manifestation",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/10. Manifestation.mp4"
        }
      ]
    },
    { 
      name: "Five Percent Review", 
      description: "Track and review your progress with 5% improvements",
      detailedDescription: "Embrace the philosophy of continuous improvement with our 5% better methodology. Track small, incremental changes that compound over time. Perfect for sustainable personal development without overwhelming yourself.",
      url: "/five-percent-reviews",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/11. Five Percent Reviews.mp4"
        }
      ]
    },
    { 
      name: "Future Me", 
      description: "Send letters to your future self for reflection and growth",
      detailedDescription: "Connect with your future self through time-delayed letters and messages. Set reminders for important milestones, reflect on your growth journey, and maintain perspective on your long-term goals. A powerful tool for self-reflection and motivation.",
      url: "/futureme",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/12. Future Me.mp4"
        }
      ]
    },
    { 
      name: "Ikigai", 
      description: "Discover your life's purpose by exploring your ikigai",
      detailedDescription: "Discover your reason for being through the Japanese concept of Ikigai. Explore the intersection of what you love, what you're good at, what the world needs, and what you can be paid for. Features interactive exercises and reflection tools.",
      url: "/ikigai",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/18. Ikigai.mp4"
        }
      ]
    },
    { 
      name: "Dreamboard", 
      description: "Create a visual dream board with drawings, texts, and images",
      detailedDescription: "Visualize your dreams and goals with our interactive dreamboard creator. Add images, drawings, text, and symbols to create a powerful visual representation of your aspirations. Features collaborative tools and export options.",
      url: "/dreamboard",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/20. Dream Board.mp4"
        }
      ]
    },
    { 
      name: "Let Me In", 
      description: "Your mental clarity zone. Let AI guide your thoughts, organize your mind, and unlock new insights.",
      detailedDescription: "Transform your mental landscape with AI-powered guidance. This module helps you organize scattered thoughts, gain mental clarity, and unlock breakthrough insights through intelligent prompts and structured thinking exercises.",
      url: "/ai-journal",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/19. Let Me In.mp4"
        }
      ]
    },
    { 
      name: "Mindmap", 
      description: "Create interactive mind maps to visualize ideas, brainstorm, and organize your thoughts.",
      detailedDescription: "Unleash your creativity with powerful mind mapping tools. Visualize complex ideas, structure your thinking, and explore connections between concepts with an intuitive, interactive interface designed for executive-level strategic thinking.",
      url: "/mindmap",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/16. Mind Map.mp4"
        }
      ]
    },
    { 
      name: "Travel P&L", 
      description: "Track your travel expenses and profit/loss by destination.",
      detailedDescription: "Master your travel finances with comprehensive P&L tracking. Monitor expenses, categorize costs, track ROI for business trips, and gain insights into your travel spending patterns to optimize future journeys.",
      url: "/travel-pl",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/17. Travel P & L.mp4"
        }
      ]
    }
  ];

  // Samsung-style auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentModuleIndex(prev => (prev + 1) % modules.length);
      }, 4000); // Change every 4 seconds
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, modules.length]);

  // Enhanced wheel navigation with smoother transitions
  useEffect(() => {
    let isScrolling = false;
    
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      
      if (containerRef.current?.contains(target) && !isScrolling) {
        e.preventDefault();
        isScrolling = true;
        setIsAutoPlaying(false); // Stop auto-play on manual interaction
        
        if (e.deltaY > 0 && currentModuleIndex < modules.length - 1) {
          setCurrentModuleIndex(prev => prev + 1);
        } else if (e.deltaY < 0 && currentModuleIndex > 0) {
          setCurrentModuleIndex(prev => prev - 1);
        }
        
        // Re-enable scrolling after animation
        setTimeout(() => {
          isScrolling = false;
        }, 1000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentModuleIndex, modules.length]);

  // Module transition effect (no scroll needed since cards are stacked)
  useEffect(() => {
    // Optional: Add any additional effects when module changes
  }, [currentModuleIndex]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showDescription) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position when modal closes
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [showDescription]);

  const handleModuleClick = (index: number) => {
    setCurrentModuleIndex(index);
    setShowDescription(true);
    setIsAutoPlaying(false); // Stop auto-play when viewing details
  };

  const handleIndicatorClick = (index: number) => {
    setCurrentModuleIndex(index);
    setIsAutoPlaying(false); // Stop auto-play on manual selection
  };

  const closeDescription = () => {
    setShowDescription(false);
  };

  const handleModuleRedirect = (url: string) => {
    // For now, we'll just show an alert since this is a landing page
    // In a real application, you would use router.push(url) or window.location.href = url
    alert(`Redirecting to: ${url}`);
  };

  return (
    <section id="modules" className="pt-32 pb-0 bg-gradient-to-b from-purple-100/30 via-slate-50 to-gray-100 relative overflow-hidden" style={{ borderRadius: 0 }}>
      {/* Subtle Background Elements with Purple Universe Theme */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-300/8 to-indigo-400/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-slate-300/12 to-gray-400/12 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-purple-200/6 to-slate-300/6 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Subtle Animated Stars */}
        <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-25"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-slate-400 rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-1 h-1 bg-purple-300 rounded-full animate-pulse opacity-20 animation-delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse opacity-25 animation-delay-3000"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">CEO Universe</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            8 powerful modules designed specifically for executive leadership and cosmic personal mastery
          </p>
        </div>

        {/* Enhanced Dashboard Screenshot */}
        <div className="mb-24 max-w-7xl mx-auto animate-scale-in">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl p-2 border border-purple-100">
              <img 
                src="/lovable-uploads/3d36dae3-f70e-4cd7-b0cd-4db9be68cd21.png" 
                alt="CEO Dashboard Interface showing all modules organized by categories"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Samsung-Style Section Heading with Zoom-in Animation */}
        <div className="text-center mb-16 relative overflow-hidden">
          <div 
            ref={titleRef}
            className={`transform transition-all duration-1200 hover:scale-105 ${
              titleVisible 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-150'
            }`}
            style={{
              transition: 'opacity 1.2s cubic-bezier(0.2, 0.6, 0.4, 1), transform 1.2s cubic-bezier(0.2, 0.6, 0.4, 1), color 1.2s cubic-bezier(0.2, 0.6, 0.4, 1)',
              color: titleVisible ? '#000000' : '#6B7280'
            }}
          >
            <h3 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Explore All <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Modules</span>
            </h3>
            <div 
              ref={subtitleRef}
              className={`relative ${
                subtitleVisible 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-120'
              }`}
              style={{
                transition: 'opacity 1s cubic-bezier(0.2, 0.6, 0.4, 1), transform 1s cubic-bezier(0.2, 0.6, 0.4, 1), color 1s cubic-bezier(0.2, 0.6, 0.4, 1)',
                transitionDelay: '0.3s',
                color: subtitleVisible ? '#374151' : '#6B7280'
              }}
            >
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Discover 17 powerful modules designed to elevate your executive performance and cosmic personal growth
              </p>
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Samsung-Style Zoom Modules with Navigation */}
        <div className="max-w-7xl mx-auto relative">
          {/* Module Content Container */}
          <div ref={containerRef} className="max-w-6xl mx-auto relative h-[600px] overflow-hidden">
          {modules.map((module, moduleIndex) => (
            <div
              key={moduleIndex}
              ref={el => moduleRefs.current[moduleIndex] = el}
              className={`absolute inset-0 transition-all duration-2000 ease-in-out ${
                moduleIndex === currentModuleIndex 
                  ? 'z-30 opacity-100 scale-100 translate-y-0' 
                  : moduleIndex < currentModuleIndex
                  ? 'z-10 opacity-30 scale-90 -translate-y-full'
                  : 'z-10 opacity-30 scale-90 translate-y-full'
              }`}
            >
              <div className="group bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden relative border-2 border-gray-300 ring-2 ring-gray-200/50 h-full transform transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] hover:ring-purple-300/70">
                {/* Module Name - Extended width and consistent height */}
                <div className={`absolute top-4 left-4 z-40 transition-all duration-700 ${
                  moduleIndex === currentModuleIndex ? 'scale-100 opacity-100' : 'scale-90 opacity-70'
                }`}>
                  <h4 className="font-bold text-xl text-white bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg min-w-[220px] h-[50px] flex items-center justify-start whitespace-nowrap">
                    {module.name}
                  </h4>
                </div>



                {/* Media Container with Zoom Effect */}
                <div 
                  className={`media-container relative h-full overflow-hidden transition-all duration-700 ${
                    moduleIndex === currentModuleIndex ? 'scale-100' : 'scale-95'
                  }`}
                  onClick={() => handleModuleClick(moduleIndex)}
                >
                  {/* Blurred background using the same image */}
                  {module.media[0].type === 'image' && (
                    <img
                      src={module.media[0].src}
                      alt="background-blur"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                      style={{ zIndex: 1 }}
                    />
                  )}
                  {module.media[0].type === 'video' && (
                    <video
                      src={module.media[0].src}
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ zIndex: 1 }}
                    />
                  )}
                  <MediaDisplay
                    media={module.media[0]}
                    className={`w-full h-full transition-all duration-1000 cursor-pointer ${
                      moduleIndex === currentModuleIndex 
                        ? 'scale-100 opacity-100' 
                        : 'scale-110 opacity-80'
                    } hover:scale-105`}
                    alt={`${module.name} screenshot`}
                  />
                  {/* Overlay for inactive modules */}
                  <div className={`absolute inset-0 transition-opacity duration-2000 ${
                    moduleIndex === currentModuleIndex ? 'opacity-0' : 'opacity-40 bg-black'
                  }`} style={{ zIndex: 3 }}></div>
                </div>
              </div>
            </div>
          ))}
          </div>
          
        </div>

        {/* Module Description Display */}
        {/* REMOVED: No persistent module description box below the cards for any module */}

        {/* Description Modal */}
        {showDescription && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={closeDescription}
          >
            <div 
              className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-purple-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeDescription}
                className="absolute top-4 right-4 z-10 text-gray-900 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {modules[currentModuleIndex].name}
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {modules[currentModuleIndex].detailedDescription}
                </p>
                
                {/* Module Media */}
                <div className="rounded-xl overflow-hidden relative" style={{height: '500px'}}>
                  {/* Blurred background for modal */}
                  {modules[currentModuleIndex].media[0].type === 'image' && (
                    <img
                      src={modules[currentModuleIndex].media[0].src}
                      alt="background-blur"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                      style={{ zIndex: 1 }}
                    />
                  )}
                  {modules[currentModuleIndex].media[0].type === 'video' && (
                    <video
                      src={modules[currentModuleIndex].media[0].src}
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ zIndex: 1 }}
                    />
                  )}
                  <MediaDisplay
                    media={modules[currentModuleIndex].media[0]}
                    className="w-full h-full rounded-xl"
                    alt={`${modules[currentModuleIndex].name} demo`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ModulesShowcase;
