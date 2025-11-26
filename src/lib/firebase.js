import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TU_APIKEY",
  authDomain: "TU_AUTHDOMAIN",
  projectId: "TU_PROJECTID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDERID",
  appId: "TU_APPID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
