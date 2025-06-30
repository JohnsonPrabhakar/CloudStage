import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD42IX8jBpr8yw3ENmUKcJIyyrR1dIHQV8",
  authDomain: "cloud-stage-d1a9a.firebaseapp.com",
  projectId: "cloud-stage-d1a9a",
  storageBucket: "cloud-stage-d1a9a.appspot.com",
  messagingSenderId: "17014826789",
  appId: "1:17014826789:web:043b9460563724db5d1ccc",
  measurementId: "G-GKPQB88Z06"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
