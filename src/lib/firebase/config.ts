import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider, browserPopupRedirectResolver, browserLocalPersistence, setPersistence } from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase if not already initialized
const apps = getApps();
export const app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Configure Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Set persistence and configure auth
if (typeof window !== 'undefined') {
  // Only run client-side code in browser
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
  
  // Set language to browser language
  auth.useDeviceLanguage();
  
  // Fix CORS issues
  const meta = document.createElement('meta');
  meta.httpEquiv = "Cross-Origin-Opener-Policy";
  meta.content = "same-origin-allow-popups";
  document.head.appendChild(meta);
  
  // Set auth settings for popup handling
  auth.settings.appVerificationDisabledForTesting = false;
  
  // Fix favicon 404 error
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon.ico';
    document.head.appendChild(favicon);
  }
} 