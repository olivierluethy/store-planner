import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ch.janek.storeplanner',
  appName: 'Ladenplaner',
  webDir: 'dist',
  backgroundColor: '#0E1116',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0E1116',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
    },
    SplashScreen: {
      backgroundColor: '#0E1116',
      showSpinner: false,
    },
  },
}

export default config
