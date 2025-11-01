import { StrictMode } from 'react'
import { Toaster } from 'sonner'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/animations.css'

import './firebase-config'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position='top-right' richColors closeButton />
  </StrictMode>,
)
