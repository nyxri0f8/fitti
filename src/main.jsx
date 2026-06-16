import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent inspection tools (F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U, and right-click)
const disableDevTools = () => {
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    // Block F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
    }
    // Block Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && ['I', 'C', 'J', 'i', 'c', 'j'].includes(e.key)) {
      e.preventDefault();
    }
    // Block Ctrl+U (View Source)
    if (e.ctrlKey && ['U', 'u'].includes(e.key)) {
      e.preventDefault();
    }
  });
};

disableDevTools();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
