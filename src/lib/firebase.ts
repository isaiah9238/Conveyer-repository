import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "demo-conveyer.firebaseapp.com",
  //projectId: "conveyer-77c20",
  storageBucket: "demo-conveyer.firebasestorage.app",
  messagingSenderId: "242374136903",
  appId: "1:242374136903:web:4b0241e2d4d20c69fd0d62",
  measurementId: "G-R3VMQLXB4Z",
  projectId: "demo-conveyer", // Match what you used in the backend init
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// THE BRIDGE: Connect to emulators if running on localhost/IDX
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  console.log("Connected to Firebase Emulators");
}

export { app, db, auth };