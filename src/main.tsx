import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LockProvider } from './components/lock/LockProvider.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx'
import { prepareSyncStorage } from './lib/sync.ts'

// Harus sebelum aplikasi tampil (lihat penjelasan di fungsinya)
prepareSyncStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LockProvider>
        <App />
      </LockProvider>
    </ThemeProvider>
  </StrictMode>,
)
