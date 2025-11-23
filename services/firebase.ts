
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-jL1dI3mG6Kl8PjzshYkSdm_1muSRDUk",
  authDomain: "brightloop-app.firebaseapp.com",
  projectId: "brightloop-app",
  storageBucket: "brightloop-app.firebasestorage.app",
  messagingSenderId: "974658803930",
  appId: "1:974658803930:web:74523f89b159d2c75f2de3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Attempt to enable offline persistence
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
        }
    });
} catch (e) {
    console.log("Persistence init skipped or not supported in this environment");
}

export const storage = getStorage(app);

console.log(
  "%c✅ BrightLoop Firebase Connected (Modular)", 
  "background: #10b981; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
);
