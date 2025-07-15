
import { useEffect, useRef, useState } from "react";

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech Startup CEO",
      content: "CEO Dashboard transformed how I manage my personal and professional life. The habit tracking alone has been a game-changer.",
      avatar: "SC"
    },
    {
      name: "Marcus Rodriguez",
      role: "Fortune 500 Executive",
      content: "Finally, a tool that understands the complexity of executive life. All 13 modules work seamlessly together.",
      avatar: "MR"
    },
    {
      name: "Emily Thompson",
      role: "Entrepreneur",
      content: "The yearly plan is incredible value. I've achieved more goals in 6 months than I did in the previous 2 years.",
      avatar: "ET"
    }
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
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden mx-8 rounded-3xl">
      {/* Universe-themed animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/15 to-purple-400/15 rounded-full opacity-25 animate-float animation-delay-1000"></div>
        <div className="absolute top-1/3 left-1/2 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full opacity-20 animate-float animation-delay-2000"></div>
        
        {/* Cosmic stars */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60 animate-twinkle"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-300 rounded-full opacity-50 animate-twinkle animation-delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-indigo-300 rounded-full opacity-70 animate-twinkle animation-delay-2000"></div>
        <div className="absolute top-60 right-20 w-1 h-1 bg-pink-300 rounded-full opacity-55 animate-twinkle animation-delay-3000"></div>
        <div className="absolute bottom-60 right-60 w-0.5 h-0.5 bg-cyan-300 rounded-full opacity-65 animate-twinkle"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by Leaders Worldwide
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of successful executives who have transformed their lives with CEO Dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className={`bg-gradient-to-br from-white/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl p-8 border border-purple-200/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-700 transform hover:-translate-y-6 hover:rotate-2 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ 
                transitionDelay: `${(index + 1) * 200}ms`,
                animation: isVisible ? `scale-in 0.8s ease-out ${(index + 1) * 0.2}s forwards` : ''
              }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-lg transform transition-transform duration-300 hover:scale-110">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
