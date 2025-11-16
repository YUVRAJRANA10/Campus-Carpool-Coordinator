import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { PerformanceProvider, PerformanceErrorBoundary } from './contexts/PerformanceContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PerformanceErrorBoundary>
      <PerformanceProvider>
        <App />
      </PerformanceProvider>
    </PerformanceErrorBoundary>
  </StrictMode>,
)