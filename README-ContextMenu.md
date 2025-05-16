# Right-Click Context Menu Implementation

## Overview

This project includes a robust right-click context menu system based on react-contexify. This allows users to right-click on navigation elements and access additional options like "Open in New Tab".

![Context Menu Preview](https://i.imgur.com/9BfdjXY.png)

## Quick Fix

If you're experiencing issues with the context menu not showing up or not working correctly:

1. Run the fix script:

   ```bash
   node fix-context-menu.js
   ```

2. Restart your development server:

   ```bash
   npm run dev
   ```

## Installation

The context menu functionality depends on react-contexify version 6.0.0:

```bash
npm install react-contexify@6.0.0 --save
```

## Components

The implementation consists of two main components:

1. **ContextMenu**: Base component that handles right-click events and displays a menu
2. **NavLinkWithContextMenu**: Special component for navigation links

## Usage Example

```tsx
import NavLinkWithContextMenu from '../shared/components/NavLinkWithContextMenu';

// In your component
<NavLinkWithContextMenu
  to="/dashboard"
  onClick={() => handleNavigation('/dashboard')}
  className="nav-link"
>
  Dashboard
</NavLinkWithContextMenu>
```

Right-clicking on this component will show a context menu with the "Open in New Tab" option.

## Detailed Documentation

For more detailed information about the components and advanced usage, see:

- [Component Documentation](./src/shared/components/README.md)
- [Implementation Details](./src/shared/components/ContextMenu.tsx)
- [Custom Styling](./src/shared/styles/contextMenu.css)

## Troubleshooting Common Issues

### Menu Not Showing

Make sure you have the correct CSS imports:

```tsx
import 'react-contexify/dist/ReactContexify.css';
```

### Styling Issues

Check that the custom styles are being imported:

```tsx
import '../styles/contextMenu.css';
```

### Multiple Context Menus

Each context menu needs a unique ID to prevent conflicts.

### Z-Index Problems

If the menu appears behind other elements, check the z-index in contextMenu.css.

## Fix Script Details

The `fix-context-menu.js` script performs the following actions:

1. Reinstalls react-contexify@6.0.0
2. Updates CSS import paths in key files
3. Creates necessary directories
4. Copies fallback CSS if needed

To run it:

```bash
node fix-context-menu.js
```

## Contributing

If you'd like to enhance the context menu functionality:

1. Understand the current implementation in `src/shared/components/ContextMenu.tsx`
2. Make your changes
3. Test thoroughly with different navigation elements
4. Update documentation as needed
