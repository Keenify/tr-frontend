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
      media: { type: "video", src: "/lovable-uploads/Daily Journal.mp4" }
    },
    {
      name: "Weekly Rhythm", 
      description: "Plan and review your weekly priorities with structured goal-setting frameworks and progress tracking",
      detailedDescription: "Establish a powerful weekly planning system that helps you stay focused on what matters most. Set intentions, track progress, and reflect on your achievements. Perfect for busy professionals who want to maintain work-life balance while achieving their goals.",
      media: { type: "video", src: "/lovable-uploads/Weekly Rhythms.mp4" }
    },
    {
      name: "Annual Calendar Plans",
      description: "Strategic yearly planning with comprehensive goal setting and milestone tracking for long-term success",
      detailedDescription: "Master your annual planning with our comprehensive calendar system. Set strategic goals, plan major milestones, and track your progress throughout the year. Perfect for executives and professionals who need to align daily actions with long-term vision and objectives.",
      media: { type: "video", src: "/lovable-uploads/Annual Calendar Plans.mp4" }
    },
    {
      name: "Habit Tracker",
      description: "Build lasting positive habits with visual progress tracking and streak monitoring for consistent growth",
      detailedDescription: "Build lasting positive habits with our intuitive tracking system. Monitor your progress, identify patterns, and celebrate streaks. Features customizable habits, visual progress indicators, and insights to help you understand your behavior patterns.",
      media: { type: "video", src: "/lovable-uploads/Habit Tracker.mp4" }
    },
    {
      name: "To-do List",
      description: "Simple, elegant task management that feels as natural as pen and paper with digital convenience",
      detailedDescription: "Experience the simplicity of a digital to-do list that feels as natural as pen and paper. Quickly capture tasks, set priorities, and check off completed items. Perfect for those who prefer minimalist productivity tools without overwhelming features.",
      media: { type: "video", src: "/lovable-uploads/To-Do List.mp4" }
    },
    {
      name: "Weekly Design System",
      description: "Structure creative projects with design sprint methodology and milestone tracking for better outcomes",
      detailedDescription: "Structure your creative projects with our design sprint methodology. Break down complex projects into manageable weekly sprints, track deliverables, and maintain momentum on your creative endeavors. Ideal for designers, developers, and creative professionals.",
      media: { type: "image", src: "/lovable-uploads/7f9297e4-9626-4110-aa40-e4f49f32c644.png" }
    },
    {
      name: "Project Management",
      description: "Comprehensive project oversight with timeline management and resource allocation for executive success",
      detailedDescription: "Comprehensive project management tools to keep your initiatives on track. Features include milestone tracking, deadline management, resource allocation, and progress visualization. Perfect for managing multiple projects simultaneously with an intuitive sidebar navigation and clean interface.",
      media: { type: "image", src: "/lovable-uploads/44b6c86f-1e58-4822-b1e6-27627ddda763.png" }
    },
    {
      name: "Personal Finance",
      description: "Take control of your financial future with intelligent budget tracking and insights for wealth building",
      detailedDescription: "Take control of your financial future with comprehensive budget tracking and expense management. Monitor income streams, categorize expenses, set savings goals, and visualize your financial health with intuitive charts and reports.",
      media: { type: "image", src: "/lovable-uploads/77ac6f1e-3107-4af0-8b84-f0a8422a9786.png" }
    },
    {
      name: "Bucket List",
      description: "Transform life dreams into actionable plans with progress tracking and celebration milestones",
      detailedDescription: "Turn your dreams into actionable plans with our bucket list manager. Categorize goals by timeline, track progress, add photos and memories, and celebrate achievements. Perfect for maintaining motivation and focus on your life aspirations.",
      media: { type: "image", src: "/lovable-uploads/fb01924f-66c7-4fda-8487-e54bcf8de069.png" }
    },
    {
      name: "Manifestation",
      description: "Harness intention-setting power with guided exercises and synchronicity tracking for goal achievement",
      detailedDescription: "Harness the power of intention setting with our manifestation tracker. Visualize your goals, track synchronicities, practice gratitude, and monitor your progress toward your desires. Includes guided exercises and reflection prompts.",
      media: { type: "image", src: "/lovable-uploads/7ac55d26-5d6c-494e-96d7-5ec52c97e77a.png" }
    },
    {
      name: "Five Percent Review",
      description: "Embrace continuous improvement with small, sustainable changes that compound over time",
      detailedDescription: "Embrace the philosophy of continuous improvement with our 5% better methodology. Track small, incremental changes that compound over time. Perfect for sustainable personal development without overwhelming yourself.",
      media: { type: "image", src: "/lovable-uploads/e164c680-f89b-4000-9e69-878b4194a114.png" }
    },
    {
      name: "Future Me",
      description: "Connect with your future self through time-delayed letters and milestone reflections for growth",
      detailedDescription: "Connect with your future self through time-delayed letters and messages. Set reminders for important milestones, reflect on your growth journey, and maintain perspective on your long-term goals. A powerful tool for self-reflection and motivation.",
      media: { type: "image", src: "/lovable-uploads/295e0ebc-d09f-4915-9d23-6121b91205d6.png" }
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
      media: { type: "image", src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png" }
    },
    {
      name: "Travel P&L",
      description: "Master travel finances with comprehensive expense tracking and ROI analysis for smart traveling",
      detailedDescription: "Master your travel finances with comprehensive P&L tracking. Monitor expenses, categorize costs, track ROI for business trips, and gain insights into your travel spending patterns to optimize future journeys.",
      media: { type: "image", src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png" }
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
                Discover 17 powerful modules designed to elevate your executive performance and cosmic personal growth
              </p>
            </div>
          </div>
        </div>


        {/* Single Module Display */}
        <div className="flex items-start justify-center max-w-7xl mx-auto gap-8">
          
          {/* Main Module Card */}
          <div className="flex-1 max-w-5xl">
            <div 
              onClick={openModal}
              className="group relative bg-white/25 backdrop-blur-lg rounded-2xl hover:bg-white/35 transition-all duration-700 ease-in-out hover:scale-[1.02] hover:shadow-2xl cursor-pointer overflow-hidden shadow-lg h-[600px]"
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
                      className="w-full h-full object-contain rounded-3xl shadow-2xl"
                      style={{ background: 'black' }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentModule.media.src}
                      alt={`${currentModule.name} preview`}
                      className="w-full h-full object-contain rounded-3xl shadow-2xl"
                    />
                  )}
                  
                  {/* Module Name Overlay - Top Left Corner */}
                  <div className="absolute top-0 left-0 bg-gray-900 text-white px-6 py-4 rounded-tl-3xl shadow-2xl min-h-[72px] flex items-center z-20">
                    <span className="text-3xl font-extrabold leading-tight">{currentModule.name}</span>
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
          
          {/* Redesigned Sidebar: All Modules in Compact Grid - Moved to Right */}
          <div className="w-80 flex-shrink-0 mt-6 h-[600px] flex flex-col justify-between">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 shadow-lg h-full">
              <div className="grid grid-cols-2 gap-2 h-full">
                {modules.map((module, index) => (
                  <button
                    key={index}
                    data-module-index={index}
                    onClick={() => setCurrentModuleIndex(index)}
                    className={`flex items-center gap-2 px-3 py-5 rounded-lg transition-all duration-300 text-left whitespace-nowrap overflow-hidden text-ellipsis font-medium shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-400/50
                      ${index === currentModuleIndex
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105 border-purple-500'
                        : 'bg-white/60 text-gray-800 hover:bg-purple-10 hover:scale-105'}
                    `}
                    style={{minWidth: 0}}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300
                      ${index === currentModuleIndex ? 'bg-white shadow' : 'bg-purple-400'}`} />
                    <span className="truncate text-xl font-semibold" title={module.name}>{module.name}</span>
                  </button>
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
                {/* Module Header */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">
                    {currentModule.name}
                  </h2>
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                  </div>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                    {currentModule.detailedDescription}
                  </p>
                </div>
                
                {/* Enhanced Module Media with Rounded Corners and Enhanced Shadow */}
                <div className="relative h-[500px]">
                  {currentModule.media.type === 'video' ? (
                    <video 
                      src={currentModule.media.src}
                      className="w-full h-full object-cover rounded-3xl shadow-2xl"
                      style={{ background: 'black' }}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentModule.media.src}
                      alt={`${currentModule.name} screenshot`}
                      className="w-full h-full object-contain rounded-3xl shadow-2xl"
                    />
                  )}
                  {/* Module Name Overlay - Top Left Corner (REMOVED FROM MODAL) */}
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