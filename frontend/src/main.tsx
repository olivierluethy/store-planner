import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IonApp, setupIonicReact } from '@ionic/react'

/* Ionic core CSS (structure only — all visuals come from Tailwind + tokens). */
import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { ToastProvider } from './context/ToastContext'

setupIonicReact({ mode: 'md' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IonApp>
      <ToastProvider>
        <AuthProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </AuthProvider>
      </ToastProvider>
    </IonApp>
  </StrictMode>,
)
