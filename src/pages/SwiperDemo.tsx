import { useState } from 'react';
import VerticalSwiper from '../components/VerticalSwiper';
import AdvancedVerticalSwiper from '../components/AdvancedVerticalSwiper';

const SwiperDemo = () => {
  const [useAdvanced, setUseAdvanced] = useState(true);

  const slides = [
    {
      id: '1',
      title: 'Welcome to CEO Dashboard',
      subtitle: 'Your Executive Command Center',
      content: 'Transform your leadership journey with 16 powerful modules designed specifically for executive performance and personal mastery.',
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      backgroundImage: '/lovable-uploads/3d36dae3-f70e-4cd7-b0cd-4db9be68cd21.png',
      overlay: 'bg-gradient-to-br from-blue-900/70 to-black/70'
    },
    {
      id: '2',
      title: 'Daily Journal',
      subtitle: 'Mindful Reflection',
      content: 'Record your thoughts and reflections with guided prompts. Build a consistent writing habit that promotes self-awareness and personal growth.',
      backgroundColor: '#1e1b4b',
      textColor: '#ffffff',
      backgroundImage: '/lovable-uploads/9d4339cc-fb5a-413e-8500-be791ea4f20f.png',
      overlay: 'bg-gradient-to-br from-purple-900/70 to-blue-900/70'
    },
    {
      id: '3',
      title: 'Weekly Rhythm',
      subtitle: 'Strategic Planning',
      content: 'Plan and review your weekly priorities and goals. Establish a powerful weekly planning system that helps you stay focused on what matters most.',
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
      backgroundImage: '/lovable-uploads/7f9297e4-9626-4110-aa40-e4f49f32c644.png',
      overlay: 'bg-gradient-to-br from-gray-900/70 to-blue-900/70'
    },
    {
      id: '4',
      title: 'Habit Tracker',
      subtitle: 'Consistency Building',
      content: 'Track your daily habits and build consistency. Monitor your progress, identify patterns, and celebrate streaks with visual progress indicators.',
      backgroundColor: '#134e4a',
      textColor: '#ffffff',
      backgroundImage: '/lovable-uploads/c3622682-2d1c-4c45-b8f8-8041feb87e52.png',
      overlay: 'bg-gradient-to-br from-teal-900/70 to-green-900/70'
    },
    {
      id: '5',
      title: 'Project Management',
      subtitle: 'Executive Organization',
      content: 'Organize and track your projects from start to finish. Features milestone tracking, deadline management, and progress visualization.',
      backgroundColor: '#7c2d12',
      textColor: '#ffffff',
      backgroundImage: '/lovable-uploads/44b6c86f-1e58-4822-b1e6-27627ddda763.png',
      overlay: 'bg-gradient-to-br from-orange-900/70 to-red-900/70'
    },
    {
      id: '6',
      title: 'Personal Finance',
      subtitle: 'Financial Mastery',
      content: 'Track income, expenses, and manage your budget. Take control of your financial future with comprehensive budget tracking and expense management.',
      backgroundColor: '#581c87',
      textColor: '#ffffff',
      backgroundImage: '/lovable-uploads/77ac6f1e-3107-4af0-8b84-f0a8422a9786.png',
      overlay: 'bg-gradient-to-br from-purple-900/70 to-pink-900/70'
    },
    {
      id: '7',
      title: 'Get Started Today',
      subtitle: 'Transform Your Leadership',
      content: 'Join thousands of executives who have transformed their productivity and personal growth with our comprehensive CEO Dashboard.',
      backgroundColor: '#14532d',
      textColor: '#ffffff',
      overlay: 'bg-gradient-to-br from-green-900/80 to-blue-900/80'
    }
  ];

  return (
    <div className="w-full h-screen relative">
      {/* Toggle button */}
      <button
        onClick={() => setUseAdvanced(!useAdvanced)}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all duration-300 text-sm font-medium"
      >
        {useAdvanced ? 'Basic Version' : 'Advanced Version'}
      </button>

      {useAdvanced ? (
        <AdvancedVerticalSwiper 
          slides={slides}
          scrollSensitivity={1.2}
          animationSpeed={1200}
          enableParallax={true}
          enableProgress={true}
        />
      ) : (
        <VerticalSwiper 
          slides={slides}
          scrollSensitivity={1.2}
        />
      )}
    </div>
  );
};

export default SwiperDemo;