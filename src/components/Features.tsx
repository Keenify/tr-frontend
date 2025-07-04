
import { Book, Calendar, Star, Users, CheckCircle, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Features = () => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    {
      icon: Book,
      title: "Daily Journaling",
      description: "Reflect, grow, and track your thoughts with our advanced journaling system."
    },
    {
      icon: CheckCircle,
      title: "Habit Tracking",
      description: "Build lasting habits and monitor your progress with detailed analytics."
    },
    {
      icon: Star,
      title: "Bucket List",
      description: "Set and achieve your life goals with our comprehensive goal tracking system."
    },
    {
      icon: Calendar,
      title: "Schedule Management",
      description: "Optimize your time and increase productivity with smart scheduling."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Lead your team effectively with collaborative productivity tools."
    },
    {
      icon: Clock,
      title: "Time Analytics",
      description: "Understand how you spend your time and optimize for maximum impact."
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animation of feature cards
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => [...prev, index]);
              }, index * 150);
            });
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
    <section id="features" ref={sectionRef} className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/30 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-600/20 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
            Everything You Need to Excel
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
            A comprehensive suite of tools designed specifically for leaders who demand excellence in every aspect of their lives.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group p-8 rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-sm border border-gray-600/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:-translate-y-4 hover:rotate-1 ${
                visibleItems.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                animation: visibleItems.includes(index) ? 'scale-in 0.6s ease-out forwards' : ''
              }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/50">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
