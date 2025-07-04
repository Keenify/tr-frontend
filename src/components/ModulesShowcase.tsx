import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ModulesShowcase = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const moduleCategories = [
    {
      title: "Daily Practices",
      modules: [
        { 
          name: "Daily Journal", 
          description: "Record your thoughts and reflections with guided prompts",
          detailedDescription: "Transform your daily routine with our comprehensive journaling system. Features guided prompts, mood tracking, gratitude exercises, and reflection spaces to help you process your thoughts and emotions. Build a consistent writing habit that promotes self-awareness and personal growth.",
          images: [
            "/lovable-uploads/cccc6b71-de09-41b4-abf4-a4371d73da2b.png"
          ]
        },
        { 
          name: "Weekly Rhythm", 
          description: "Plan and review your weekly priorities and goals",
          detailedDescription: "Establish a powerful weekly planning system that helps you stay focused on what matters most. Set intentions, track progress, and reflect on your achievements. Perfect for busy professionals who want to maintain work-life balance while achieving their goals.",
          images: [
            "/lovable-uploads/9d4339cc-fb5a-413e-8500-be791ea4f20f.png",
            "/lovable-uploads/d0f1ef09-5018-425e-9113-6f95f4c94200.png"
          ]
        },
        { 
          name: "Habit Tracker", 
          description: "Track your daily habits and build consistency",
          detailedDescription: "Build lasting positive habits with our intuitive tracking system. Monitor your progress, identify patterns, and celebrate streaks. Features customizable habits, visual progress indicators, and insights to help you understand your behavior patterns.",
          images: [
            "/lovable-uploads/c3622682-2d1c-4c45-b8f8-8041feb87e52.png"
          ]
        }
      ]
    },
    {
      title: "Productivity",
      modules: [
        { 
          name: "To-do List", 
          description: "A simple and easy-to-use to-do list, like a piece of paper",
          detailedDescription: "Experience the simplicity of a digital to-do list that feels as natural as pen and paper. Quickly capture tasks, set priorities, and check off completed items. Perfect for those who prefer minimalist productivity tools without overwhelming features.",
          images: [
            "/lovable-uploads/0571b04f-4bf8-48a9-bc01-f5c9a7bd7921.png"
          ]
        },
        { 
          name: "Weekly Design Sprint", 
          description: "Plan and track your weekly activities with a design focus",
          detailedDescription: "Structure your creative projects with our design sprint methodology. Break down complex projects into manageable weekly sprints, track deliverables, and maintain momentum on your creative endeavors. Ideal for designers, developers, and creative professionals.",
          images: [
            "/lovable-uploads/7f9297e4-9626-4110-aa40-e4f49f32c644.png"
          ]
        },
        { 
          name: "Project Management", 
          description: "Organize and track your projects from start to finish",
          detailedDescription: "Comprehensive project management tools to keep your initiatives on track. Features include milestone tracking, deadline management, resource allocation, and progress visualization. Perfect for managing multiple projects simultaneously with an intuitive sidebar navigation and clean interface.",
          images: [
            "/lovable-uploads/44b6c86f-1e58-4822-b1e6-27627ddda763.png"
          ]
        }
      ]
    },
    {
      title: "Life & Finance",
      modules: [
        { 
          name: "Personal Finance", 
          description: "Track income, expenses, and manage your budget",
          detailedDescription: "Take control of your financial future with comprehensive budget tracking and expense management. Monitor income streams, categorize expenses, set savings goals, and visualize your financial health with intuitive charts and reports.",
          images: [
            "/lovable-uploads/77ac6f1e-3107-4af0-8b84-f0a8422a9786.png"
          ]
        },
        { 
          name: "Bucket List", 
          description: "Create and manage your life goals and dreams",
          detailedDescription: "Turn your dreams into actionable plans with our bucket list manager. Categorize goals by timeline, track progress, add photos and memories, and celebrate achievements. Perfect for maintaining motivation and focus on your life aspirations.",
          images: [
            "/lovable-uploads/fb01924f-66c7-4fda-8487-e54bcf8de069.png"
          ]
        }
      ]
    },
    {
      title: "Self-Growth",
      modules: [
        { 
          name: "Manifestation", 
          description: "Set intentions and track your manifestation journey",
          detailedDescription: "Harness the power of intention setting with our manifestation tracker. Visualize your goals, track synchronicities, practice gratitude, and monitor your progress toward your desires. Includes guided exercises and reflection prompts.",
          images: [
            "/lovable-uploads/7ac55d26-5d6c-494e-96d7-5ec52c97e77a.png"
          ]
        },
        { 
          name: "Five Percent Review", 
          description: "Track and review your progress with 5% improvements",
          detailedDescription: "Embrace the philosophy of continuous improvement with our 5% better methodology. Track small, incremental changes that compound over time. Perfect for sustainable personal development without overwhelming yourself.",
          images: [
            "/lovable-uploads/e164c680-f89b-4000-9e69-878b4194a114.png"
          ]
        },
        { 
          name: "Future Me", 
          description: "Send letters to your future self for reflection and growth",
          detailedDescription: "Connect with your future self through time-delayed letters and messages. Set reminders for important milestones, reflect on your growth journey, and maintain perspective on your long-term goals. A powerful tool for self-reflection and motivation.",
          images: [
            "/lovable-uploads/295e0ebc-d09f-4915-9d23-6121b91205d6.png"
          ]
        },
        { 
          name: "Ikigai", 
          description: "Discover your life's purpose by exploring your ikigai",
          detailedDescription: "Discover your reason for being through the Japanese concept of Ikigai. Explore the intersection of what you love, what you're good at, what the world needs, and what you can be paid for. Features interactive exercises and reflection tools.",
          images: [
            "/lovable-uploads/a5a312cb-e64c-4ef8-a123-fcf76bd6dbf1.png"
          ]
        },
        { 
          name: "Dreamboard", 
          description: "Create a visual dream board with drawings, texts, and images",
          detailedDescription: "Visualize your dreams and goals with our interactive dreamboard creator. Add images, drawings, text, and symbols to create a powerful visual representation of your aspirations. Features collaborative tools and export options.",
          images: [
            "/lovable-uploads/56f0c4ce-30d3-47dc-a1a2-e031c0a470b2.png"
          ]
        }
      ]
    }
  ];

  const totalModules = moduleCategories.reduce((total, category) => total + category.modules.length, 0);

  return (
    <section id="modules" className="py-32 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full text-sm font-medium text-blue-400 mb-6">
            ✨ {totalModules} Powerful Modules
          </div>
          <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-400 to-white bg-clip-text text-transparent mb-6 leading-tight">
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              To Excel
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Every aspect of personal and professional growth covered in one 
            <span className="font-semibold text-blue-400"> comprehensive dashboard</span>
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

        {/* Enhanced Modules by Category */}
        <div className="space-y-20">
          {moduleCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-8 animate-slide-up" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              <div className="text-center">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {category.title}
                </h3>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.modules.map((module, moduleIndex) => (
                  <Dialog key={moduleIndex} open={openDialog === `${categoryIndex}-${moduleIndex}`} onOpenChange={(open) => setOpenDialog(open ? `${categoryIndex}-${moduleIndex}` : null)}>
                    <DialogTrigger asChild>
                      <div className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-gray-700/50 overflow-hidden cursor-pointer relative">
                        {/* Gradient Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        
                        {/* Enhanced Image Container */}
                        <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                          {module.images.length > 1 ? (
                            <Carousel className="w-full h-full" opts={{ loop: true }}>
                              <CarouselContent>
                                {module.images.map((image, imageIndex) => (
                                  <CarouselItem key={imageIndex}>
                                    <img 
                                      src={image} 
                                      alt={`${module.name} screenshot ${imageIndex + 1}`}
                                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious className="left-2 bg-white/90 hover:bg-white" />
                              <CarouselNext className="right-2 bg-white/90 hover:bg-white" />
                            </Carousel>
                          ) : (
                            <img 
                              src={module.images[0]} 
                              alt={`${module.name} screenshot`}
                              className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          )}
                          
                          {/* Overlay Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        
                        {/* Enhanced Content */}
                        <div className="p-8 relative z-10">
                          <div className="flex items-center mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                              <span className="text-white font-bold text-xl">
                                {categoryIndex === 0 ? '📝' : 
                                 categoryIndex === 1 ? '⚡' : 
                                 categoryIndex === 2 ? '💰' : '🌱'}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-bold text-xl text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
                            {module.name}
                          </h4>
                          <p className="text-gray-300 leading-relaxed">
                            {module.description}
                          </p>
                          
                          {/* Hover Arrow */}
                          <div className="flex items-center mt-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-sm font-medium">Learn more</span>
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl animate-in data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-700">
                      <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {module.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="p-8 pt-0 overflow-y-auto max-h-[80vh]">
                        <div className="space-y-8">
                          {/* Enhanced Image Gallery with Slideshow */}
                          <div className="w-full relative">
                            {module.images.length > 1 ? (
                              <Carousel className="w-full group" opts={{ loop: true }}>
                                <CarouselContent>
                                  {module.images.map((image, imageIndex) => (
                                    <CarouselItem key={imageIndex}>
                                      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                                        <img 
                                          src={image} 
                                          alt={`${module.name} screenshot ${imageIndex + 1}`}
                                          className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                          {imageIndex + 1} / {module.images.length}
                                        </div>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-4 bg-white/90 hover:bg-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 w-12" />
                                <CarouselNext className="right-4 bg-white/90 hover:bg-white shadow-xl hover:shadow-2xl transition-all duration-300 h-12 w-12" />
                              </Carousel>
                            ) : (
                              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                <img 
                                  src={module.images[0]} 
                                  alt={`${module.name} screenshot`}
                                  className="w-full h-[400px] md:h-[500px] object-cover"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Enhanced Description */}
                          <div className="space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8">
                            <h3 className="text-2xl font-bold text-gray-900">About This Module</h3>
                            <p className="text-gray-700 leading-relaxed text-lg">{module.detailedDescription}</p>
                          </div>
                          
                          {/* Enhanced Features List */}
                          <div className="space-y-6 bg-white rounded-3xl p-8 border border-gray-100 shadow-lg">
                            <h3 className="text-2xl font-bold text-gray-900">Key Features</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {[
                                "Intuitive and user-friendly interface",
                                "Real-time progress tracking",
                                "Customizable settings and preferences",
                                "Export and backup capabilities",
                                "Mobile-responsive design"
                              ].map((feature, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                  <span className="text-gray-700 text-lg">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Enhanced CTA Button */}
                          <div className="flex justify-center pt-6">
                            <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                              Get Started with {module.name}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesShowcase;
