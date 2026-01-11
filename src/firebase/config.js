import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBtjHKt8yQXY_bq8aBUbnvRKLdCYkcCuL0",
  authDomain: "euneizapp.firebaseapp.com",
  projectId: "euneizapp",
  storageBucket: "euneizapp.firebasestorage.app",
  messagingSenderId: "742122175698",
  appId: "1:742122175698:web:a892d421836886efdb410b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);