import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCvcdiMNJ6K8J47JZ3WE4PNH99sOS2HTa8",
  authDomain: "lecturemate-ad674.firebaseapp.com",
  projectId: "lecturemate-ad674",
  storageBucket: "lecturemate-ad674.firebasestorage.app",
  messagingSenderId: "372498362553",
  appId: "1:372498362553:web:0f75a6865f72f1debc6b68",
  measurementId: "G-Y46VK5MNH3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); 