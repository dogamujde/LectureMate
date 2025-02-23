import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
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