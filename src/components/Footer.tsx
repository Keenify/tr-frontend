
const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 py-12 border-t border-purple-200/50 relative overflow-hidden mx-8 rounded-b-3xl">
      {/* Universe-themed footer elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-20 w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-twinkle"></div>
        <div className="absolute bottom-10 right-20 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-25 animate-twinkle animation-delay-1000"></div>
        <div className="absolute top-20 right-40 w-0.5 h-0.5 bg-pink-400 rounded-full opacity-40 animate-twinkle animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-1 h-1 bg-cyan-400 rounded-full opacity-35 animate-twinkle animation-delay-3000"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CEO Dashboard
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              The ultimate productivity suite for high achievers. Transform your life with 13 powerful modules designed specifically for leaders and entrepreneurs.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer">
                <span className="text-sm font-bold">f</span>
              </div>
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                <span className="text-sm font-bold">t</span>
              </div>
              <div className="w-10 h-10 bg-purple-700 rounded-lg flex items-center justify-center hover:bg-purple-800 transition-colors cursor-pointer">
                <span className="text-sm font-bold">in</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Product</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#" className="hover:text-purple-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Modules</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Updates</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Support</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="#" className="hover:text-purple-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-purple-200 mt-12 pt-8 text-center text-gray-600">
          <p>&copy; 2024 CEO Dashboard. All rights reserved. Built for leaders, by leaders.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
