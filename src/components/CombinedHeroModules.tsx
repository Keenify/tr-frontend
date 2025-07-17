import { Button } from "@/components/ui/button";
import ExploreModules from "@/components/ExploreModules";
import { useState, useEffect } from "react";


const CombinedHeroModules = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);


  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToModules = () => {
    document.getElementById('modules-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
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
      
      {/* Combined Hero Section and Dashboard Image with Single Purple Universe Background */}
      <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 overflow-hidden mx-6 rounded-3xl">
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

      {/* Explore Modules Section */}
      <ExploreModules />
    </section>
  );
};

export default CombinedHeroModules;