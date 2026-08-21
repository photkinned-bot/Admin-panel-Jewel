import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { WorkshopProvider } from './context/WorkshopContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkshopProvider>
      <App />
    </WorkshopProvider>
  </StrictMode>,
);
