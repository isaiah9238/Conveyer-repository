// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "FIREBASE_SERVICE_ACCOUNT",
  NEXT_AUTH_DOMAIN: "studio-2772757020-e1e46.firebaseapp.com",
  NEXT_PROJECT_ID: "studio-2772757020-e1e46",
  NEXT_STORAGE_BUCKET: "studio-2772757020-e1e46.firebasestorage.app",
  NEXT_MESSENGING_ID: "53908489351",
  NEXT_APP_ID: "1:53908489351:web:f3281b9afe2dc20528a422"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
