import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.jewellery',
  appName: 'Jewellery Software',
  webDir: '.next', // Points to Next.js build output
  server: {
    // Production: Load from Vercel
    // For local dev, set CAPACITOR_SERVER_URL=http://10.0.2.2:3000
    url: process.env.CAPACITOR_SERVER_URL || 'https://jewellery-software-app.vercel.app',
    // Allow cleartext (HTTP) for local development
    // Production builds will use HTTPS from Vercel
    cleartext: process.env.CAPACITOR_SERVER_URL?.startsWith('http://') ?? false,
  },
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS,
    },
    allowMixedContent: false, // Security: prevent mixed HTTP/HTTPS
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: true, // Allow content to go under status bar
    },
  },
};

export default config;

