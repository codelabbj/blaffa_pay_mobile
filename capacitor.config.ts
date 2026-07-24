import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blaffapay.codelab',
  appName: 'Blaffa Pay',
  webDir: 'out',
  server: {
    url: 'https://blaffa-pay.vercel.app',
    cleartext: false,
  },
};

export default config;
