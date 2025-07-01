import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3ICTBkzhRijyMiGp8JPjkftKbUWuFcKQ",
  authDomain: "cloudstage-5quap.firebaseapp.com",
  projectId: "cloudstage-5quap",
  storageBucket: "cloudstage-5quap.appspot.com",
  messagingSenderId: "47546684219",
  appId: "1:47546684219:web:3883613156950d48b91d1e"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect to the default database instance
const db = getFirestore(app);

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
