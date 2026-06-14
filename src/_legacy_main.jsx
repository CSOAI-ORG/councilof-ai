import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './ProofOfTheme.css'
import './Navigation.css'
import AppWithRouter from './AppWithRouter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithRouter />
  </StrictMode>,
)
