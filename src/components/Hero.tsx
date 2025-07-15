
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const leftElementsRef = useRef<HTMLDivElement>(null);
  const rightElementsRef = useRef<HTMLDivElement>(null);

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

  const scrollToModules = () => {
    document.getElementById('modules')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-white text-gray-900 overflow-hidden pt-8 px-8 pb-8">
      {/* Universe-themed Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
      
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
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-6xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            CEO <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">Dashboard</span>
          </h1>
          
          <p className={`text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed transition-all duration-1000 delay-300 font-semibold ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Your Personal <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Universe</span> for Life and Work.
          </p>
          
          <p className={`text-lg md:text-xl text-gray-600 mb-8 leading-relaxed transition-all duration-1000 delay-400 font-medium ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            16 integrated tools to help CEOs and founders navigate their personal galaxy, build stellar habits, track cosmic growth, and manage life like the universe.
          </p>
          
          <div className={`flex justify-center mb-24 transition-all duration-1000 delay-500 ${
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
    </section>
  );
};

export default Hero;
