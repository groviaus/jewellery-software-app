import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.jewellery',
  appName: 'Jewellery Software',
  webDir: '.next', // Points to Next.js build output
  server: {
    // Production: Load from Vercel
    url: process.env.CAPACITOR_SERVER_URL || 'https://your-app.vercel.app',
    cleartext: false, // Set to true only for local HTTP development
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
      backgroundColor: '#ffffff',
    },
  },
};

export default config;

