import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3ICTBkzhRijyMiGp8JPjkftKbUWuFcKQ",
  authDomain: "cloudstage-5quap.firebaseapp.com",
  projectId: "cloudstage-5quap",
  storageBucket: "cloudstage-5quap.appspot.com",
  messagingSenderId: "47546684219",
  appId: "1:47546684219:web:a4ee6a5a9505c9d3b91d1e"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const messaging = isSupported().then(yes => yes ? getMessaging(app) : null);

export { db, auth, storage, messaging };
