# CEO Life Launchpad - Landing Page

A modern, responsive landing page for the CEO Life Launchpad dashboard application. Built with React, TypeScript, and Tailwind CSS, featuring an elegant universe-themed design with cosmic animations.

## 🚀 Features

- **Modern React Architecture**: Built with React 18 and TypeScript for type safety
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Universe Theme**: Cosmic background animations and visual effects
- **Component Showcase**: Interactive modules showcase with pricing and testimonials
- **ShadCN UI Components**: Comprehensive UI component library
- **Performance Optimized**: Vite build system for fast development and builds

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Carousel**: Swiper.js and Embla Carousel
- **Forms**: React Hook Form with Zod validation

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CEO-Dashboard-Landing-page
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is occupied).

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN UI components
│   ├── Header.tsx      # Navigation header
│   ├── Hero.tsx        # Hero section
│   ├── CombinedHeroModules.tsx  # Main hero with modules
│   ├── ExploreModules.tsx       # Interactive modules showcase
│   ├── ModulesShowcase.tsx      # Module feature display
│   ├── Pricing.tsx     # Pricing section
│   ├── Testimonials.tsx # Customer testimonials
│   └── Footer.tsx      # Site footer
├── pages/              # Page components
│   ├── Index.tsx       # Main landing page
│   ├── NotFound.tsx    # 404 page
│   └── SwiperDemo.tsx  # Demo page
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── App.tsx             # Main app component
```

## 🎨 Design Features

- **Cosmic Theme**: Universe-inspired background with animated stars and floating elements
- **Gradient Backgrounds**: Beautiful purple-to-indigo gradients throughout
- **Smooth Animations**: CSS animations for twinkling stars and floating orbs
- **Modern Typography**: Clean, readable fonts with proper hierarchy
- **Interactive Elements**: Hover effects and smooth transitions

## 📱 Responsive Design

The landing page is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run vercel-build` - Vercel deployment build

## 🎯 Key Components

### CombinedHeroModules
Main hero section combining the introductory content with an interactive modules showcase.

### ExploreModules
Interactive component displaying various dashboard modules with smooth transitions and hover effects.

### ModulesShowcase
Detailed showcase of individual modules with media content and descriptions.

### Pricing
Pricing plans section with feature comparisons and call-to-action buttons.

### Testimonials
Customer testimonial carousel with smooth animations.

## 🔧 Configuration

The project uses several configuration files:
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - ShadCN UI configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.
