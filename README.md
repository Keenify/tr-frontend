# CEO Dashboard Landing Page

A modern, responsive landing page for a CEO Dashboard application built with React and TypeScript.

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your system. You can install it using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

### Installation

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd CEO-Dashboard-Landing-page

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is occupied).

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues

## Technologies Used

This project is built with modern web technologies:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library for building user interfaces
- **shadcn/ui** - Modern UI component library
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Features.tsx    # Features section
│   ├── Hero.tsx        # Hero section
│   ├── Pricing.tsx     # Pricing section
│   └── ...
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── main.tsx           # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
