import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Evita alteracao acidental de inputs numericos focados ao rolar a pagina
window.addEventListener(
  'wheel',
  () => {
    const ativo = document.activeElement
    if (ativo instanceof HTMLInputElement && ativo.type === 'number') {
      ativo.blur()
    }
  },
  { passive: true, capture: true }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
