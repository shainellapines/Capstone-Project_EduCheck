import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installSessionGuard } from './utils/session.js'
import { installTheme } from './utils/theme.js'
import { installSidebar } from './utils/sidebar.js'

// Must run before any page has a chance to fetch — see session.js for why.
installSessionGuard()

// Must run before the first paint — see theme.js for why.
installTheme()
installSidebar()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
