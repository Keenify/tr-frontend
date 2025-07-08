import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
      />
    );
  }
  
  // For both "image" and "gif" types
  return (
    <img 
      src={media.src}
      alt={alt}
      className={className}
    />
  );
};

const ModulesShowcase = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const modules = [
    { 
      name: "Daily Journal", 
      description: "Record your thoughts and reflections with guided prompts",
      detailedDescription: "Transform your daily routine with our comprehensive journaling system. Features guided prompts, mood tracking, gratitude exercises, and reflection spaces to help you process your thoughts and emotions. Build a consistent writing habit that promotes self-awareness and personal growth.",
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
      media: [
        {
          type: "image",
          src: "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png"
        }
      ]
    }
  ];

  return (
    <section id="modules" className="py-32 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">CEO Toolkit</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            16 powerful modules designed specifically for executive leadership and personal mastery
          </p>
        </div>

        {/* Enhanced Dashboard Screenshot */}
        <div className="mb-24 max-w-7xl mx-auto animate-scale-in">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl p-2 border border-gray-100">
              <img 
                src="/lovable-uploads/3d36dae3-f70e-4cd7-b0cd-4db9be68cd21.png" 
                alt="CEO Dashboard Interface showing all modules organized by categories"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Modules Grid Heading */}
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Explore All Modules
          </h3>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Click any module below to learn more about its features and capabilities
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, moduleIndex) => (
            <Dialog key={moduleIndex} open={openDialog === moduleIndex.toString()} onOpenChange={(open) => setOpenDialog(open ? moduleIndex.toString() : null)}>
              <DialogTrigger asChild>
                <div className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border-2 border-white/30 hover:border-transparent overflow-hidden cursor-pointer relative">
                  {/* Vibrant Gradient Border Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-cyan-200 rounded-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-tl from-yellow-100 via-orange-200 to-red-200 opacity-95 rounded-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-bl from-green-100 via-blue-200 to-indigo-300 opacity-90 rounded-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-100 via-violet-200 to-purple-300 opacity-85 rounded-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-lime-100 via-emerald-200 to-teal-300 opacity-80 rounded-2xl"></div>
                  </div>
                  <div className="absolute inset-1 bg-gray-900/80 backdrop-blur-sm rounded-xl z-10"></div>
                  
                  {/* Enhanced Media Container */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden z-20">
                    <MediaDisplay
                      media={module.media[0]}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={`${module.name} screenshot`}
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Enhanced Content */}
                  <div className="p-8 relative z-20 text-center">
                    <h4 className="font-bold text-xl text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                      {module.name}
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                      {module.description}
                    </p>
                    
                    {/* Hover Arrow */}
                    <div className="flex items-center justify-center mt-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-medium">View Demo</span>
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                <div className="relative w-full">
                  <div className="relative rounded-2xl overflow-hidden">
                    <MediaDisplay
                      media={module.media[0]}
                      className="w-full h-auto object-cover"
                      alt={`${module.name} demo`}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesShowcase;
