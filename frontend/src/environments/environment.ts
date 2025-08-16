export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'your_firebase_api_key',
    authDomain: 'your_project.firebaseapp.com',
    projectId: 'your_project_id',
    storageBucket: 'your_project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your_app_id'
  },
  googleMaps: {
    apiKey: 'your_google_maps_api_key'
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