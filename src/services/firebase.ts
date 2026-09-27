import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore using the database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;
