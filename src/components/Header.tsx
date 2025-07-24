import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-purple-200/50 shadow-2xl shadow-purple-500/10">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between relative">
          {/* Logo - Left Section */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
              CEO Dashboard
            </span>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 px-3 py-2"
            >
              Home
            </button>

            <button
              onClick={() => scrollToSection('modules-section')}
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 px-3 py-2"
            >
              Modules
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 px-3 py-2"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 px-3 py-2"
            >
              Reviews
            </button>
          </nav>

          {/* CTA Button - Right Section */}
          <div className="hidden md:flex items-center flex-1 justify-end">
            <Button 
              variant="outline"
              className="border-purple-300 text-gray-900 hover:bg-purple-600 hover:text-white font-medium px-6 py-2 rounded-full transition-all duration-300"
            >
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-purple-100 transition-colors duration-200 flex-shrink-0 ml-2"
          >
            {isMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-purple-200">
            <div className="flex flex-col space-y-3 pt-4">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-left text-gray-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200"
              >
                Home
              </button>

              <button
                onClick={() => scrollToSection('modules-section')}
                className="text-left text-gray-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200"
              >
                Modules
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left text-gray-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-left text-gray-700 hover:text-purple-600 font-medium py-2 transition-colors duration-200"
              >
                Reviews
              </button>
              <Button 
                variant="outline"
                className="border-purple-300 text-gray-900 hover:bg-purple-600 hover:text-white font-medium px-6 py-2 rounded-full transition-all duration-300 mt-2"
              >
                Sign In
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 