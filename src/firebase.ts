import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCvcdiMNJ6K8J47JZ3WE4PNH99sOS2HTa8",
  authDomain: "lecturemate-ad674.firebaseapp.com",
  projectId: "lecturemate-ad674",
  storageBucket: "lecturemate-ad674.firebasestorage.app",
  messagingSenderId: "372498362553",
  appId: "1:372498362553:web:0f75a6865f72f1debc6b68"
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