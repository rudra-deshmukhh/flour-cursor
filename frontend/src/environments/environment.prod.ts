export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
  firebase: {
    apiKey: 'your_production_firebase_api_key',
    authDomain: 'your_production_project.firebaseapp.com',
    projectId: 'your_production_project_id',
    storageBucket: 'your_production_project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your_production_app_id'
  },
  googleMaps: {
    apiKey: 'your_production_google_maps_api_key'
  },
  app: {
    name: 'Flour Delivery',
    version: '1.0.0',
    description: 'Fresh flour delivered to your doorstep'
  },
  features: {
    pwa: true,
    notifications: true,
    locationServices: true,
    realTimeTracking: true
  }
};