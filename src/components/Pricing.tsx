
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);



  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-white via-gray-50 to-purple-50 text-gray-900 relative overflow-hidden mx-8 rounded-3xl">
      {/* Universe-themed animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-purple-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-indigo-400 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-10 right-20 w-2 h-2 bg-yellow-400 rounded-full opacity-30 animate-twinkle"></div>
        <div className="absolute bottom-10 left-20 w-1 h-1 bg-blue-400 rounded-full opacity-40 animate-twinkle" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that works for you. Cancel anytime, no questions asked.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className={`bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-purple-200 transform transition-all duration-700 hover:scale-105 hover:bg-white/90 hover:shadow-2xl hover:shadow-purple-500/25 flex flex-col ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Monthly Plan</h3>
              <div className="text-5xl font-bold mb-2 animate-pulse">$15</div>
              <div className="text-purple-600">per month</div>
            </div>
            
            <div className="flex-1"></div>
            
            <Button className="w-full bg-purple-600 hover:bg-purple-700 border border-purple-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              Start Monthly Plan
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className={`bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl p-8 text-white relative overflow-hidden transform transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 flex flex-col ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`} style={{ transitionDelay: '400ms' }}>
            <div className="absolute top-4 right-4 animate-bounce">
              <span className="bg-black text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                Recommended
              </span>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Yearly Plan</h3>
              <div className="text-5xl font-bold mb-2 animate-pulse">$100</div>
              <div className="text-black/70">per year</div>
              <div className="text-sm mt-2 bg-black/10 rounded-lg px-3 py-1 inline-block animate-bounce">
                Save $80 per year!
              </div>
            </div>
            
            <div className="flex-1"></div>
            
            <Button className="w-full bg-black hover:bg-black/80 text-yellow-400 font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              Start Yearly Plan
            </Button>
          </div>
        </div>

        <div className={`text-center mt-12 transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-gray-400">
            30-day money-back guarantee • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
