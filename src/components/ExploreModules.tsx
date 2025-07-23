import React, { useState, useEffect, useRef } from "react";
import { X, Play, ChevronUp, ChevronDown } from "lucide-react";

const ExploreModules = () => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const modules = [
    {
      name: "Daily Journal",
      description: "Record your thoughts and reflections with guided prompts for deeper self-awareness and personal growth",
      detailedDescription: "Transform your daily routine with our comprehensive journaling system. Features guided prompts, mood tracking, gratitude exercises, and reflection spaces to help you process your thoughts and emotions. Build a consistent writing habit that promotes self-awareness and personal growth.",
      media: { type: "video", src: "/lovable-uploads/1. Daily Journal.mp4" }  
    },
    {
      name: "Weekly Rhythm", 
      description: "Plan and review your weekly priorities with structured goal-setting frameworks and progress tracking",
      detailedDescription: "Establish a powerful weekly planning system that helps you stay focused on what matters most. Set intentions, track progress, and reflect on your achievements. Perfect for busy professionals who want to maintain work-life balance while achieving their goals.",
      media: { type: "video", src: "/lovable-uploads/2. Weekly Rhythms.mp4" }
    },
    {
      name: "Annual Calendar Plans",
      description: "Strategic yearly planning with comprehensive goal setting and milestone tracking for long-term success",
      detailedDescription: "Master your annual planning with our comprehensive calendar system. Set strategic goals, plan major milestones, and track your progress throughout the year. Perfect for executives and professionals who need to align daily actions with long-term vision and objectives.",
      media: { type: "video", src: "/lovable-uploads/3. Annual Calendar Plans.mp4" }
    },
    {
      name: "Habit Tracker",
      description: "Build lasting positive habits with visual progress tracking and streak monitoring for consistent growth",
      detailedDescription: "Build lasting positive habits with our intuitive tracking system. Monitor your progress, identify patterns, and celebrate streaks. Features customizable habits, visual progress indicators, and insights to help you understand your behavior patterns.",
      media: { type: "video", src: "/lovable-uploads/4. Habit Tracker.mp4" }
    },
    {
      name: "To-do List",
      description: "Simple, elegant task management that feels as natural as pen and paper with digital convenience",
      detailedDescription: "Experience the simplicity of a digital to-do list that feels as natural as pen and paper. Quickly capture tasks, set priorities, and check off completed items. Perfect for those who prefer minimalist productivity tools without overwhelming features.",
      media: { type: "video", src: "/lovable-uploads/5. To-Do List.mp4" }
    },
    {
      name: "Weekly Design System",
      description: "Structure creative projects with design sprint methodology and milestone tracking for better outcomes",
      detailedDescription: "Structure your creative projects with our design sprint methodology. Break down complex projects into manageable weekly sprints, track deliverables, and maintain momentum on your creative endeavors. Ideal for designers, developers, and creative professionals.",
      media: { type: "video", src: "/lovable-uploads/6. Weekly Design System.mp4" }
    },
    {
      name: "Project Management",
      description: "Comprehensive project oversight with timeline management and resource allocation for executive success",
      detailedDescription: "Comprehensive project management tools to keep your initiatives on track. Features include milestone tracking, deadline management, resource allocation, and progress visualization. Perfect for managing multiple projects simultaneously with an intuitive sidebar navigation and clean interface.",
      media: { type: "video", src: "/lovable-uploads/7. Project Management.mp4" }
    },
    {
      name: "Personal Finance",
      description: "Take control of your financial future with intelligent budget tracking and insights for wealth building",
      detailedDescription: "Take control of your financial future with comprehensive budget tracking and expense management. Monitor income streams, categorize expenses, set savings goals, and visualize your financial health with intuitive charts and reports.",
      media: { type: "video", src: "/lovable-uploads/8. Personal Finance.mp4" }
    },
    {
      name: "Bucket List",
      description: "Transform life dreams into actionable plans with progress tracking and celebration milestones",
      detailedDescription: "Turn your dreams into actionable plans with our bucket list manager. Categorize goals by timeline, track progress, add photos and memories, and celebrate achievements. Perfect for maintaining motivation and focus on your life aspirations.",
      media: { type: "video", src: "/lovable-uploads/9. Bucket List.mp4" }
    },
    {
      name: "Manifestation",
      description: "Harness intention-setting power with guided exercises and synchronicity tracking for goal achievement",
      detailedDescription: "Harness the power of intention setting with our manifestation tracker. Visualize your goals, track synchronicities, practice gratitude, and monitor your progress toward your desires. Includes guided exercises and reflection prompts.",
      media: { type: "video", src: "/lovable-uploads/10. Manifestation.mp4" }
    },
    {
      name: "Five Percent Review",
      description: "Embrace continuous improvement with small, sustainable changes that compound over time",
      detailedDescription: "Embrace the philosophy of continuous improvement with our 5% better methodology. Track small, incremental changes that compound over time. Perfect for sustainable personal development without overwhelming yourself.",
      media: { type: "video", src: "/lovable-uploads/11. Five Percent Reviews.mp4" }
    },
    {
      name: "Future Me",
      description: "Connect with your future self through time-delayed letters and milestone reflections for growth",
      detailedDescription: "Connect with your future self through time-delayed letters and messages. Set reminders for important milestones, reflect on your growth journey, and maintain perspective on your long-term goals. A powerful tool for self-reflection and motivation.",
      media: { type: "video", src: "/lovable-uploads/12. Future Me.mp4" }
    },
    {
      name: "Ikigai",
      description: "Discover your life's purpose through the Japanese philosophy of reason for being and fulfillment",
      detailedDescription: "Discover your reason for being through the Japanese concept of Ikigai. Explore the intersection of what you love, what you're good at, what the world needs, and what you can be paid for. Features interactive exercises and reflection tools.",
      media: { type: "image", src: "/lovable-uploads/a5a312cb-e64c-4ef8-a123-fcf76bd6dbf1.png" }
    },
    {
      name: "Dreamboard",
      description: "Visualize aspirations with interactive mood boards, images, and creative elements for inspiration",
      detailedDescription: "Visualize your dreams and goals with our interactive dreamboard creator. Add images, drawings, text, and symbols to create a powerful visual representation of your aspirations. Features collaborative tools and export options.",
      media: { type: "image", src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png" }
    },
    {
      name: "Let Me In",
      description: "AI-powered mental clarity zone to organize thoughts and unlock breakthrough insights for innovation",
      detailedDescription: "Transform your mental landscape with AI-powered guidance. This module helps you organize scattered thoughts, gain mental clarity, and unlock breakthrough insights through intelligent prompts and structured thinking exercises.",
      media: { type: "image", src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png" }
    },
    {
      name: "Mindmap",
      description: "Visualize complex ideas with interactive mind mapping for strategic thinking and problem solving",
      detailedDescription: "Unleash your creativity with powerful mind mapping tools. Visualize complex ideas, structure your thinking, and explore connections between concepts with an intuitive, interactive interface designed for executive-level strategic thinking.",
      media: { type: "video", src: "/lovable-uploads/16. Mind Map.mp4" }  
    },
    {
      name: "Travel P&L",
      description: "Master travel finances with comprehensive expense tracking and ROI analysis for smart traveling",
      detailedDescription: "Master your travel finances with comprehensive P&L tracking. Monitor expenses, categorize costs, track ROI for business trips, and gain insights into your travel spending patterns to optimize future journeys.",
      media: { type: "video", src: "/lovable-uploads/17. Travel P & L.mp4" }
    }
  ];

  const currentModule = modules[currentModuleIndex];

  // Auto-scroll to active module in sidebar for better UX
  useEffect(() => {
    const activeButton = document.querySelector(`[data-module-index="${currentModuleIndex}"]`);
    if (activeButton && sidebarRef.current) {
      const sidebar = sidebarRef.current;
      const button = activeButton as HTMLElement;
      const sidebarRect = sidebar.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      
      const isVisible = buttonRect.top >= sidebarRect.top && buttonRect.bottom <= sidebarRect.bottom;
      
      if (!isVisible) {
        button.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }
    }
  }, [currentModuleIndex]);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // Ensure we stay in the modules section after closing modal
    setTimeout(() => {
      document.getElementById('modules-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [showModal]);

  return (
    <div id="modules-section" className="py-16 relative overflow-hidden mx-6 rounded-3xl mt-8">
      {/* Strong Universe-themed Background for Modules Section */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/60 via-indigo-300/50 to-purple-500/40"></div>
        
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/40 to-indigo-600/35 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/45 to-purple-600/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-purple-400/35 to-indigo-500/30 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="absolute top-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/30 to-purple-500/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-[550px] h-[550px] bg-gradient-to-br from-purple-400/40 to-indigo-500/35 rounded-full blur-3xl"></div>
        
        <div className="absolute top-10 left-10 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-70"></div>
        <div className="absolute top-20 right-20 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse opacity-80 animation-delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-2.5 h-2.5 bg-purple-300 rounded-full animate-pulse opacity-65 animation-delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-indigo-400 rounded-full animate-pulse opacity-75 animation-delay-3000"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60 animation-delay-1500"></div>
        <div className="absolute top-3/4 right-1/4 w-2.5 h-2.5 bg-indigo-300 rounded-full animate-pulse opacity-70 animation-delay-2500"></div>
        <div className="absolute top-1/4 right-1/6 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-55 animation-delay-500"></div>
        <div className="absolute bottom-1/4 left-1/6 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse opacity-65 animation-delay-3500"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div className="transform transition-all duration-1000 hover:scale-105">
            <h3 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight drop-shadow-lg">
              Explore All <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Modules</span>
            </h3>
            <div>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Experience the demo and discover how it drives measurable progress.
              </p>
            </div>
          </div>
        </div>


        {/* Single Module Display */}
        <div className="flex items-start justify-center max-w-7xl mx-auto gap-8">
          
          {/* Main Module Card */}
          <div className="flex-1 max-w-5xl h-[600px]">
            <div 
              onClick={openModal}
              className="group relative bg-white/25 backdrop-blur-lg rounded-2xl hover:bg-white/35 transition-all duration-700 ease-in-out hover:scale-[1.02] hover:shadow-2xl cursor-pointer overflow-hidden shadow-lg h-full"
            >
              {/* Enhanced Tech Grid Background Pattern */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    linear-gradient(rgba(139, 92, 246, 0.6) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(139, 92, 246, 0.6) 1px, transparent 1px),
                    linear-gradient(45deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                    linear-gradient(-45deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px, 20px 20px, 40px 40px, 40px 40px'
                }}></div>
              </div>
              
              {/* Scanning Line Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse animation-delay-500"></div>
              </div>
              
              {/* Enhanced Corner Tech Elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-ping animation-delay-300"></div>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-80 transition-all duration-700 animate-pulse animation-delay-200"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-80 transition-all duration-700 animate-pulse animation-delay-500"></div>
              
              <div className="relative z-10 h-full">
                {/* Module Media Preview - Full Size with Enhanced Shadow */}
                <div className="relative w-full h-full">
                  {currentModule.media.type === 'video' ? (
                    <video 
                      src={currentModule.media.src}
                      className="w-full h-full rounded-3xl shadow-2xl"
                      style={{ objectFit: 'contain', background: '#fff' }}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onError={(e) => {
                        console.error('Video loading error:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <img
                      src={currentModule.media.src}
                      alt={`${currentModule.name} preview`}
                      className="w-full h-full rounded-3xl shadow-2xl"
                      style={{ objectFit: 'contain', background: '#fff' }}
                    />
                  )}
                  
                  {/* Module Name Overlay - Extended width and consistent height */}
                  <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg z-20 min-w-[220px] h-[50px] flex items-center justify-start">
                    <span className="text-xl font-bold whitespace-nowrap">{currentModule.name}</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Floating Tech Particles */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute top-8 left-8 w-3 h-3 bg-cyan-400 rounded-full animate-ping animation-delay-100"></div>
                <div className="absolute bottom-8 right-8 w-3 h-3 bg-purple-400 rounded-full animate-ping animation-delay-300"></div>
                <div className="absolute top-1/2 left-4 w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-500"></div>
                <div className="absolute top-1/4 right-4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse animation-delay-700"></div>
                <div className="absolute top-3/4 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping animation-delay-200"></div>
                <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping animation-delay-600"></div>
                <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-pulse animation-delay-400"></div>
                <div className="absolute top-5/6 right-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse animation-delay-800"></div>
              </div>
              
              {/* Data Stream Lines */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-1000 pointer-events-none">
                <div className="absolute top-4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-pulse animation-delay-300"></div>
                <div className="absolute bottom-4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent animate-pulse animation-delay-600"></div>
                <div className="absolute top-0 left-4 w-px h-full bg-gradient-to-b from-transparent via-indigo-400/60 to-transparent animate-pulse animation-delay-450"></div>
                <div className="absolute top-0 right-4 w-px h-full bg-gradient-to-b from-transparent via-pink-400/60 to-transparent animate-pulse animation-delay-750"></div>
              </div>
            </div>
          </div>
          
          {/* Redesigned Sidebar: All Modules in Single Vertical Line */}
          <div className="w-80 flex-shrink-0 h-[600px]">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 shadow-lg h-full">
              <div className="flex flex-col gap-0 h-full justify-between pt-1">
                {modules.map((module, index) => (
                  <div key={index} className="flex flex-col">
                    <button
                      data-module-index={index}
                      onClick={() => setCurrentModuleIndex(index)}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-300 text-left whitespace-nowrap overflow-hidden text-ellipsis font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/50 flex-shrink-0
                        ${index === currentModuleIndex
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-transparent text-gray-800 hover:bg-white/30 hover:scale-105'}
                      `}
                      style={{minWidth: 0}}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300
                        ${index === currentModuleIndex ? 'bg-white shadow' : 'bg-purple-400'}`} />
                      <span className="truncate text-sm font-semibold" title={module.name}>{module.name}</span>
                    </button>
                    {index < modules.length - 1 && (
                      <div className="h-px bg-gray-300/30 mx-3 my-0.5"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>



        {/* Enhanced Modal for Detailed View */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={closeModal}
          >
            <div 
              className="relative bg-white rounded-3xl max-w-6xl w-full my-8 border-2 border-purple-200 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-6 right-6 z-10 text-gray-600 hover:text-gray-900 transition-colors bg-white/80 rounded-full p-2 backdrop-blur-sm"
              >
                <X size={24} />
              </button>

              {/* Modal Content */}
              <div className="p-8">
                {/* Module Header with Name and Description */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {currentModule.name}
                  </h2>
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                  </div>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto mb-6">
                    {currentModule.description}
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
                    {currentModule.detailedDescription}
                  </p>
                </div>
                
                {/* Enhanced Module Media with Rounded Corners and Enhanced Shadow */}
                <div className="relative h-[500px]">
                  {currentModule.media.type === 'video' ? (
                    <video 
                      src={currentModule.media.src}
                      className="w-full h-full rounded-3xl shadow-2xl"
                      style={{ objectFit: 'cover', background: 'black' }}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onError={(e) => {
                        console.error('Video loading error:', e);
                      }}
                    />
                  ) : (
                    <img
                      src={currentModule.media.src}
                      alt={`${currentModule.name} screenshot`}
                      className="w-full h-full rounded-3xl shadow-2xl"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExploreModules;