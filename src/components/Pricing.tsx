
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    "All 13 powerful modules",
    "Unlimited entries and tracking",
    "Advanced analytics and insights",
    "Cloud sync across devices",
    "Priority customer support",
    "Regular feature updates",
    "Data export capabilities",
    "Custom goal templates"
  ];

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
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-blue-600 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that works for you. Cancel anytime, no questions asked.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 transform transition-all duration-700 hover:scale-105 hover:bg-white/15 hover:shadow-2xl hover:shadow-blue-500/25 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Monthly Plan</h3>
              <div className="text-5xl font-bold mb-2 animate-pulse">$15</div>
              <div className="text-blue-200">per month</div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center opacity-0 animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              Start Monthly Plan
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className={`bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-black relative overflow-hidden transform transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 ${
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
            
            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center opacity-0 animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-black/80">{feature}</span>
                </li>
              ))}
            </ul>
            
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
