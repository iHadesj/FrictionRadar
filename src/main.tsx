import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled locally (offline-first): no runtime Google Fonts.
import '@fontsource-variable/big-shoulders-display/wght'
import '@fontsource-variable/jetbrains-mono/wght'
import './styles/tokens.css'
import './styles/global.css'
import './styles/home.css'
import './styles/capture.css'
import './styles/signals.css'
import './styles/patterns.css'
import './styles/settings.css'
import { AppShell } from './app/AppShell'
import { MotionProvider } from './app/MotionProvider'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <AppShell />
    </MotionProvider>
  </StrictMode>
)
