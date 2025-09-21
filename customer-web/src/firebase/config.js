import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // We'll add your config here next
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
