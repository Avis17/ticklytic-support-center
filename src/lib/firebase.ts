
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAzqmU4BpTebyRGFP7YZv0hRHhX6ZoTiXc",
  authDomain: "ticklytic.firebaseapp.com",
  projectId: "ticklytic",
  storageBucket: "ticklytic.firebasestorage.app",
  messagingSenderId: "960732240773",
  appId: "1:960732240773:web:8802d1eaab655715b182ec",
  measurementId: "G-ZVV15EF1BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
