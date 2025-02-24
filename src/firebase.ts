import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Clean up any existing Firebase apps
const apps = getApps();
if (apps.length > 0) {
  apps.forEach(app => deleteApp(app));
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Storage with custom settings
const storage = getStorage(app);

// Define metadata for uploads
const metadata = {
  contentType: 'application/pdf',
  customMetadata: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Access-Control-Max-Age': '3600'
  }
};

export { app, storage, metadata }; 