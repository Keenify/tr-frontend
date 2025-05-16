# Context Menu Components

This directory contains reusable context menu components for the application. The implementation uses `react-contexify` to provide a consistent right-click menu experience across the application.

## Components

### 1. ContextMenu

The base component that handles right-click interactions and displays a custom menu.

```tsx
import ContextMenu from '../shared/components/ContextMenu';

const options = [
  {
    label: 'Custom Option',
    action: () => console.log('Custom action'),
    icon: <Icon size={16} />
  }
];

<ContextMenu options={options} id="unique-menu-id">
  <div>Right-click me</div>
</ContextMenu>
```

### 2. NavLinkWithContextMenu

A specialized component for navigation links with built-in "Open in New Tab" functionality.

```tsx
import NavLinkWithContextMenu from '../shared/components/NavLinkWithContextMenu';

<NavLinkWithContextMenu
  to="/some-path"
  onClick={() => console.log('Clicked')}
  isActive={true}
  className="my-custom-class"
>
  Navigation Link
</NavLinkWithContextMenu>
```

## Installation

The components depend on react-contexify version 6.0.0. If you encounter any issues:

1. Run the fix script:

   ```bash
   node fix-context-menu.js
   ```

2. Or manually install the required dependency:

   ```bash
   npm remove react-contexify
   npm install react-contexify@6.0.0 --save
   ```

## Troubleshooting

### Common Issues

1. **Menu doesn't appear**: Make sure you have the correct CSS imports:

   ```tsx
   import 'react-contexify/dist/ReactContexify.css';
   ```

2. **Style issues**: Our custom styles are in:

   ```tsx
   import '../styles/contextMenu.css';
   ```

3. **Multiple menus**: Each context menu needs a unique ID to prevent conflicts:

   ```tsx
   <ContextMenu id="unique-id-1" options={options}>...</ContextMenu>
   <ContextMenu id="unique-id-2" options={options}>...</ContextMenu>
   ```

4. **Z-index issues**: If the menu appears behind other elements, check the z-index in contextMenu.css

### Fix Script Details

The `fix-context-menu.js` script in the project root does the following:

1. Reinstalls react-contexify@6.0.0
2. Updates CSS import paths in key files
3. Creates necessary directories
4. Copies fallback CSS if needed

## Customization

### Adding New Menu Options

To add custom options to a context menu:

```tsx
const menuOptions = [
  {
    label: 'Option Text',
    action: () => { /* your code here */ },
    icon: <YourIconComponent size={16} /> // Optional
  },
  // Add more options as needed
];

<ContextMenu options={menuOptions} id="my-menu">
  {children}
</ContextMenu>
```

### Styling

The appearance of the context menu can be customized by editing:
-`src/shared/styles/contextMenu.css` for global styles
-Adding class names to the `className` prop for local styles

## Implementation Details

The context menu uses `react-contexify` which handles:
-Positioning the menu relative to the click point
-Closing the menu when clicking outside
-Keyboard accessibility (Escape key support)
-Animation effects

Our custom wrapper adds:
-Consistent styling across the application
-Type safety with TypeScript
-Easy-to-use predefined options
-Special components for navigation links
