import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyCHIiwLOElxpJvKp5BNszG0nVIfbA6-SdY",
    authDomain: "dynamicweb-e2ab3.firebaseapp.com",
    projectId: "dynamicweb-e2ab3",
    storageBucket: "dynamicweb-e2ab3.firebasestorage.app",
    messagingSenderId: "642855759049",
    appId: "1:642855759049:web:61245ed84ad7c66ff1f118",
    measurementId: "G-844RRBDE04"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Use robust persistent caching instead of getFirestore()
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
const auth = getAuth(app);
export const functions = getFunctions(app);

export { db, auth };
