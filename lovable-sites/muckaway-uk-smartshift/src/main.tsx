import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ProductionReadyPWA } from './components/ProductionReadyPWA'
import { GlobalProvider } from './components/GlobalProvider'
import { initAnalytics } from './lib/analytics'
import './index.css'
import './i18n/config'

// Initialize analytics (will check for consent internally)
initAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalProvider>
      <ProductionReadyPWA />
      <App />
    </GlobalProvider>
  </StrictMode>
);
