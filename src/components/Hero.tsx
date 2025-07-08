
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToModules = () => {
    document.getElementById('modules')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden pt-8 px-8 pb-8">
      {/* Ultra-Vibrant Multi-Color Background with Full Visibility */}
      <div className="absolute top-20 left-6 right-6 bottom-6 rounded-3xl shadow-2xl overflow-hidden">
        {/* Ultra-Vibrant Base Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-cyan-200"></div>
        
        {/* Maximum Bright Layer 2 */}
        <div className="absolute inset-0 bg-gradient-to-tl from-yellow-100 via-orange-200 to-red-200 opacity-95"></div>
        
        {/* Electric Bright Layer 3 */}
        <div className="absolute inset-0 bg-gradient-to-bl from-green-100 via-blue-200 to-indigo-300 opacity-90"></div>
        
        {/* Neon Bright Layer 4 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-100 via-violet-200 to-purple-300 opacity-85"></div>
        
        {/* Super Bright Layer 5 */}
        <div className="absolute inset-0 bg-gradient-to-br from-lime-100 via-emerald-200 to-teal-300 opacity-80"></div>
        
        {/* Ultra-Bright Rainbow */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/40 via-yellow-100/40 via-green-100/40 via-blue-100/40 via-indigo-100/40 via-purple-100/40 to-pink-100/40 animate-pulse"></div>
        
        {/* Maximum Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
      </div>
      
      {/* Animated Background Pattern */}
      <div className="absolute top-20 left-6 right-6 bottom-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] animate-pulse rounded-3xl"></div>
      
      {/* Dark Floating Elements for Bright Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-800/70 rounded-full animate-bounce opacity-80"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gray-700/60 rounded-full animate-bounce opacity-70 animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-gray-800/70 rounded-full animate-bounce opacity-75 animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-gray-700/60 rounded-full animate-bounce opacity-70 animation-delay-3000"></div>
      </div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-6xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 text-gray-900 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            CEO <span className="text-gray-900 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,1)]">Dashboard</span>
          </h1>
          
          <p className={`text-xl md:text-2xl text-gray-800 mb-4 leading-relaxed transition-all duration-1000 delay-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] font-semibold ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Your Personal Operating System for Life and Work.
          </p>
          
          <p className={`text-lg md:text-xl text-gray-700 mb-8 leading-relaxed transition-all duration-1000 delay-400 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] font-medium ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            16 integrated tools to help CEOs and founders lead with clarity, build habits that last, track personal growth, and manage life like business.
          </p>
          
          <div className={`flex justify-center mb-12 transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <Button 
              size="lg" 
              onClick={scrollToModules}
              className="bg-gray-900 hover:bg-black text-white hover:text-white font-bold px-12 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-gray-900/50 border-2 border-gray-900/20"
            >
              See the CEO Tools
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
