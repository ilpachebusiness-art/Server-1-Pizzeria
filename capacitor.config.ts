import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pizzaflow.app',
  appName: 'PizzaFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;


