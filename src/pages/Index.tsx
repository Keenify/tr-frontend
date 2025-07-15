
import Header from "@/components/Header";
import CombinedHeroModules from "@/components/CombinedHeroModules";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative shadow-2xl">
        {/* Universe-themed background elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated cosmic background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-white/50 to-purple-50/30"></div>
          
          {/* Floating cosmic elements */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-twinkle"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full opacity-50 animate-twinkle animation-delay-1000"></div>
          <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-60 animate-twinkle animation-delay-2000"></div>
          <div className="absolute top-60 right-20 w-1 h-1 bg-cyan-400 rounded-full opacity-45 animate-twinkle animation-delay-3000"></div>
          <div className="absolute bottom-60 right-60 w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-55 animate-twinkle"></div>
          <div className="absolute top-80 left-60 w-1 h-1 bg-indigo-400 rounded-full opacity-50 animate-twinkle animation-delay-1000"></div>
          <div className="absolute bottom-80 left-80 w-1.5 h-1.5 bg-purple-500 rounded-full opacity-40 animate-twinkle animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-500 rounded-full opacity-60 animate-twinkle animation-delay-3000"></div>
          
          {/* Larger cosmic orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-pink-400/10 to-cyan-400/10 rounded-full animate-float animation-delay-2000"></div>
        </div>
        
        <div className="relative z-10">
          <Header />
          <div id="hero">
            <CombinedHeroModules />
          </div>
          <div id="pricing">
            <Pricing />
          </div>
          <div id="testimonials">
            <Testimonials />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Index;
