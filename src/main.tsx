/**
 * Entry point for the React application.
 * 
 * This file is responsible for rendering the root component of the application
 * into the DOM. It uses React's StrictMode to help identify potential problems
 * in the application by activating additional checks and warnings.
 * 
 * The application is rendered into the HTML element with the id 'root'.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create a root and render the App component wrapped in StrictMode
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>   
);
