import { Button } from "@/components/ui/button";
import ExploreModules from "@/components/ExploreModules";
import { useState, useEffect, useRef } from "react";


const CombinedHeroModules = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
    
    // Load Vanta.js scripts
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    document.head.appendChild(script1);
    
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js';
      document.head.appendChild(script2);
      
      script2.onload = () => {
        if (vantaRef.current && window.VANTA) {
          window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x8b5cf6,
            backgroundColor: 0x0f0519,
            points: 15.00,
            maxDistance: 25.00,
            spacing: 18.00
          });
        }
      };
    };
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
      
      {/* Combined Hero Section and Dashboard Image with Vanta.js Fog Background */}
      <div ref={vantaRef} className="relative overflow-hidden mx-6 rounded-3xl" style={{ minHeight: '100vh' }}>
        
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
              Navigate your own galaxy, build better habits, track growth, and manage life with ease.
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

declare global {
  interface Window {
    VANTA?: any;
  }
}