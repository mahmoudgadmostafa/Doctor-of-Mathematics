// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDJGcsNO9xigxpSmwIEPmaOmN8wY0hNSwo",
  authDomain: "math-teacher-platform.firebaseapp.com",
  projectId: "math-teacher-platform",
  storageBucket: "math-teacher-platform.firebasestorage.app",
  messagingSenderId: "685219952466",
  appId: "1:685219952466:web:107e1a7499824ec8932c8b",
  measurementId: "G-WY7FVKXHXR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
