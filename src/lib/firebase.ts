import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Note: The build process may inject the correct config for deployment.
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

// Connect to the default database instance
const db = getFirestore(app);

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
