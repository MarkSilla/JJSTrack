import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const Toaster = lazy(() => import('sonner').then((module) => ({ default: module.Toaster })))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Suspense fallback={null}>
      <Toaster position="top-right" richColors closeButton expand />
    </Suspense>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {})
  })
}
