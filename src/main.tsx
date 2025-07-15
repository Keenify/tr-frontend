import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import integrate_components from '../integrate_components.jsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
