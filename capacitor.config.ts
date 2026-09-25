import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.urjaai.app', appName: 'UrjaAI', webDir: 'android-dist',
  server: { androidScheme: 'https', cleartext: false },
  android: { allowMixedContent: false },
  plugins: { SplashScreen: { launchAutoHide: true, launchShowDuration: 800, backgroundColor: '#215b48', androidSplashResourceName: 'urjaai_icon', androidScaleType: 'CENTER_INSIDE' } },
};
export default config;
