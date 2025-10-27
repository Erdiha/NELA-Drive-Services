import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCIJfIlDJvx_tomr2hQnGlpgMB84G3KYlI",
  authDomain: "personal-rideshare.firebaseapp.com",
  projectId: "personal-rideshare",
  storageBucket: "personal-rideshare.firebasestorage.app",
  messagingSenderId: "1071735058811",
  appId: "1:1071735058811:android:e944d46a9e3d4b6394cdde",
  measurementId: "G-QC0604B68G",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
