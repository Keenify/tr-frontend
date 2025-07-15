import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

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
        style={{ objectFit: 'contain', width: '100%', height: '100%', position: 'relative', zIndex: 2 }}
      />
    );
  }
  
  // For both "image" and "gif" types
  return (
    <img 
      src={media.src}
      alt={alt}
      className={className}
      style={{ objectFit: 'contain', width: '100%', height: '100%', position: 'relative', zIndex: 2 }}
    />
  );
};

const CombinedHeroModules = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const leftElementsRef = useRef<HTMLDivElement>(null);
  const rightElementsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const modules = [
    { 
      name: "Daily Journal", 
      description: "Record your thoughts and reflections with guided prompts",
      detailedDescription: "Transform your daily routine with our comprehensive journaling system. Features guided prompts, mood tracking, gratitude exercises, and reflection spaces to help you process your thoughts and emotions. Build a consistent writing habit that promotes self-awareness and personal growth.",
      url: "/journaling",
      media: [
        {
          type: "video",
          src: "/lovable-uploads/Daily Journal.mp4"
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
          type: "image",
          src: "/lovable-uploads/9d4339cc-fb5a-413e-8500-be791ea4f20f.png"
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
          type: "image",
          src: "/lovable-uploads/c3622682-2d1c-4c45-b8f8-8041feb87e52.png"
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
          type: "image",
          src: "/lovable-uploads/0571b04f-4bf8-48a9-bc01-f5c9a7bd7921.png"
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
          type: "image",
          src: "/lovable-uploads/7f9297e4-9626-4110-aa40-e4f49f32c644.png"
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
          type: "image",
          src: "/lovable-uploads/44b6c86f-1e58-4822-b1e6-27627ddda763.png"
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
          type: "image",
          src: "/lovable-uploads/77ac6f1e-3107-4af0-8b84-f0a8422a9786.png"
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
          type: "image",
          src: "/lovable-uploads/fb01924f-66c7-4fda-8487-e54bcf8de069.png"
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
          type: "image",
          src: "/lovable-uploads/7ac55d26-5d6c-494e-96d7-5ec52c97e77a.png"
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
          type: "image",
          src: "/lovable-uploads/e164c680-f89b-4000-9e69-878b4194a114.png"
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
          type: "image",
          src: "/lovable-uploads/295e0ebc-d09f-4915-9d23-6121b91205d6.png"
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
          type: "image",
          src: "/lovable-uploads/a5a312cb-e64c-4ef8-a123-fcf76bd6dbf1.png"
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
          type: "image",
          src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png"
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
          type: "image",
          src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png"
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
          type: "image",
          src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png"
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
          type: "image",
          src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png"
        }
      ]
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      
      // Calculate animation progress (0 to 1)
      const progress = Math.min(scrollPosition / window.innerHeight, 1);
      
      // Move elements from sides to center
      if (leftElementsRef.current) {
        leftElementsRef.current.style.transform = `translateX(${progress * 100}px)`;
      }
      if (rightElementsRef.current) {
        rightElementsRef.current.style.transform = `translateX(${-progress * 100}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const scrollToModules = () => {
    document.getElementById('modules-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

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
    <section className="relative min-h-screen text-gray-900 overflow-hidden">
      {/* Universe-themed Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/70 via-white/80 to-purple-50/70"></div>
      
      {/* Animated Stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-blue-400 rounded-full animate-pulse opacity-70 animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-50 animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-65 animation-delay-3000"></div>
        <div className="absolute top-1/2 left-1/5 w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse opacity-75"></div>
        <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-indigo-400 rounded-full animate-pulse opacity-60 animation-delay-1000"></div>
      </div>
      
      {/* Left Side Elements */}
      <div ref={leftElementsRef} className="absolute left-0 top-0 h-full w-1/3 transition-transform duration-300 ease-out">
        <div className="absolute top-20 left-10 w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-40 left-20 w-6 h-6 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-25 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-60 left-5 w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full opacity-35 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-80 left-32 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-30 animate-pulse animation-delay-3000"></div>
        <div className="absolute bottom-40 left-8 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-60 left-24 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-40 animate-pulse animation-delay-1000"></div>
      </div>
      
      {/* Right Side Elements */}
      <div ref={rightElementsRef} className="absolute right-0 top-0 h-full w-1/3 transition-transform duration-300 ease-out">
        <div className="absolute top-20 right-10 w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-gradient-to-r from-red-400 to-pink-400 rounded-full opacity-25 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-60 right-5 w-3 h-3 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-35 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-80 right-32 w-5 h-5 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full opacity-30 animate-pulse animation-delay-3000"></div>
        <div className="absolute bottom-40 right-8 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-60 right-24 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-40 animate-pulse animation-delay-1000"></div>
      </div>
      
      {/* Combined Hero Section and Dashboard Image with Single Purple Universe Background */}
      <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 overflow-hidden">
        {/* Single Universe-themed Background for entire section */}
        <div className="absolute inset-0">
          {/* Animated cosmic background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-indigo-600/70 to-purple-700/80"></div>
          
          {/* Floating cosmic elements distributed across entire section */}
          <div className="absolute top-10 left-10 w-3 h-3 bg-white rounded-full opacity-60 animate-twinkle"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-twinkle animation-delay-1000"></div>
          <div className="absolute top-32 left-32 w-2.5 h-2.5 bg-pink-300 rounded-full opacity-50 animate-twinkle animation-delay-2000"></div>
          <div className="absolute top-40 right-40 w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-65 animate-twinkle animation-delay-3000"></div>
          <div className="absolute top-60 right-80 w-1 h-1 bg-purple-300 rounded-full opacity-80 animate-twinkle"></div>
          <div className="absolute top-80 left-80 w-2 h-2 bg-indigo-300 rounded-full opacity-55 animate-twinkle animation-delay-1000"></div>
          
          {/* Middle section cosmic elements */}
          <div className="absolute top-96 left-20 w-2 h-2 bg-white rounded-full opacity-40 animate-twinkle animation-delay-2000"></div>
          <div className="absolute top-[28rem] right-40 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-50 animate-twinkle animation-delay-1000"></div>
          <div className="absolute top-[32rem] left-40 w-1 h-1 bg-pink-300 rounded-full opacity-60 animate-twinkle animation-delay-2000"></div>
          <div className="absolute top-[36rem] right-20 w-2 h-2 bg-cyan-300 rounded-full opacity-45 animate-twinkle animation-delay-3000"></div>
          
          {/* Larger cosmic orbs spread throughout */}
          <div className="absolute top-1/4 left-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full animate-float"></div>
          <div className="absolute top-1/2 right-10 w-56 h-56 bg-gradient-to-br from-indigo-400/15 to-purple-400/15 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-cyan-400/10 rounded-full animate-float animation-delay-2000"></div>
        </div>
        
        {/* Hero Content */}
        <div className="container mx-auto px-6 text-center relative z-10 pt-56 pb-6">
          <div className="max-w-4xl mx-auto">
            <h1 className={`mt-2 text-6xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 text-white ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              CEO <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-pulse">Dashboard</span>
            </h1>
            
            <p className={`text-xl md:text-2xl text-white mb-4 leading-relaxed transition-all duration-1000 delay-300 font-semibold ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              Your Personal <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Universe</span> for Life and Work.
            </p>
            
            <p className={`text-lg md:text-xl text-white/90 mb-8 leading-relaxed transition-all duration-1000 delay-400 font-medium ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              16 integrated tools to help CEOs and founders navigate their personal galaxy, build stellar habits, track cosmic growth, and manage life like the universe.
            </p>
            
            <div className={`flex justify-center mb-6 transition-all duration-1000 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Button 
                size="lg" 
                onClick={scrollToModules}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-12 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 border-2 border-purple-200"
              >
                Explore the Universe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Dashboard Screenshot within same background */}
        <div className="pb-16 relative z-10">
          <div className="max-w-6xl mx-auto px-1 flex justify-center items-center">
            <img 
              src="/lovable-uploads/ceo-dashboard-pic.png" 
              alt="CEO Dashboard UI Overview"
              className="w-full h-auto rounded-2xl shadow-2xl border-2 border-white/10 backdrop-blur-sm"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>

      {/* Modules Section - White Background with Clear Border */}
      <div id="modules-section" className="py-16 bg-white relative overflow-hidden border-t-4 border-gray-200 shadow-lg">
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Heading */}
          <div className="text-center mb-16 relative overflow-hidden">
            <div className="transform transition-all duration-1000 hover:scale-105">
              <h3 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Explore All <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Modules</span>
              </h3>
              <div className="relative">
                <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                  Discover 16 powerful modules designed to elevate your executive performance and cosmic personal growth
                </p>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>

          {/* Samsung-Style Zoom Modules */}
          <div ref={containerRef} className="max-w-6xl mx-auto relative h-[600px] overflow-hidden pr-20">
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
                  {/* Module Name - Animated */}
                  <div className={`absolute top-0 left-0 z-40 transition-all duration-700 ${
                    moduleIndex === currentModuleIndex ? 'scale-100 opacity-100' : 'scale-90 opacity-70'
                  }`}>
                    <h4 className="font-bold text-3xl text-gray-900 bg-white/90 px-6 py-3 rounded-tl-3xl rounded-br-xl backdrop-blur-md border-2 border-gray-400 shadow-xl ring-2 ring-gray-300/50">
                      {module.name}
                    </h4>
                  </div>

                  {/* Media Container with Zoom Effect */}
                  <div 
                    className={`media-container relative h-full overflow-hidden transition-all duration-700 ${
                      moduleIndex === currentModuleIndex ? 'scale-100' : 'scale-95'
                    } rounded-3xl`}
                    onClick={() => handleModuleClick(moduleIndex)}
                  >
                    {/* Blurred background using the same image */}
                    {module.media[0].type === 'image' && (
                      <img
                        src={module.media[0].src}
                        alt="background-blur"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 rounded-3xl"
                        style={{ zIndex: 1 }}
                      />
                    )}
                    {module.media[0].type === 'video' && (
                      <video
                        src={module.media[0].src}
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 rounded-3xl"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ zIndex: 1 }}
                      />
                    )}
                    <MediaDisplay
                      media={module.media[0]}
                      className={`w-full h-full transition-all duration-1000 cursor-pointer rounded-3xl ${
                        moduleIndex === currentModuleIndex 
                          ? 'scale-100 opacity-100' 
                          : 'scale-110 opacity-80'
                      } hover:scale-105`}
                      alt={`${module.name} screenshot`}
                    />
                    {/* Overlay for inactive modules */}
                    <div className={`absolute inset-0 transition-opacity duration-2000 ${
                      moduleIndex === currentModuleIndex ? 'opacity-0' : 'opacity-40 bg-black'
                    } rounded-2xl`} style={{ zIndex: 3 }}></div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Right Side Bubble Circle Navigation */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1.5 z-50 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-300">
              {modules.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleIndicatorClick(index)}
                  className={`group relative rounded-full transition-all duration-300 border shadow-lg flex items-center justify-center hover:scale-110 ${
                    index === currentModuleIndex 
                      ? 'w-5 h-5 bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 scale-110 shadow-purple-500/30' 
                      : 'w-3.5 h-3.5 bg-white/90 hover:bg-white border-gray-400 hover:border-gray-500'
                  }`}
                  aria-label={`Go to module ${index + 1}: ${modules[index].name}`}
                  title={modules[index].name}
                >
                  {/* Active indicator dot */}
                  {index === currentModuleIndex && (
                    <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-green-500 rounded-full border border-white shadow-sm animate-pulse"></div>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                    {modules[index].name}
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-3 border-l-gray-900 border-t-1.5 border-t-transparent border-b-1.5 border-b-transparent"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description Modal */}
          {showDescription && (
            <div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
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
                  
                  {/* Module Image */}
                  <div className="rounded-xl overflow-hidden relative" style={{height: '360px'}}>
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
                      className="w-full h-full"
                      alt={`${modules[currentModuleIndex].name} demo`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CombinedHeroModules;