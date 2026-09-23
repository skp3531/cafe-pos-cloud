import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgQKph0cbDFWp4hAtu6DgNoew-Frjz-JM",
  authDomain: "cafe-pos-e39d6.firebaseapp.com",
  projectId: "cafe-pos-e39d6",
  storageBucket: "cafe-pos-e39d6.firebasestorage.app",
  messagingSenderId: "916285219868",
  appId: "1:916285219868:web:022adf0fca3002a817abd9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Enable offline persistence (Firebase handles this automatically, but we can explicitly enable it)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn("Firebase persistence: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firebase persistence: Not supported by browser.");
    }
});

// SHA-256 Hashing for PINs
export const hashPin = async (pin) => {
  const msgUint8 = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Helper for unique IDs
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export { app, db, storage, auth, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, writeBatch };
