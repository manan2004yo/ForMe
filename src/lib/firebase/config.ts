// ============================================================
// FORME — Firebase Configuration
// ============================================================
// 
// HOW TO SET UP FIREBASE:
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add project" → name it "forme-app" → Continue
// 3. Disable Google Analytics (optional) → Create project
// 4. Click the </> Web icon to add a web app
// 5. Register app with nickname "forme-web"
// 6. Copy the firebaseConfig object values below
// 7. Go to Authentication → Get started → Enable:
//    - Email/Password (Sign-in method)
//    - Google (Sign-in method)
// 8. Go to Firestore Database → Create database → Start in test mode
//    (Switch to production rules before launch)
//
// ⚠️  Replace these placeholder values with your real Firebase config:
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Auth
export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account',
})

// Firestore
export const db = getFirestore(app)

// Storage
export const storage = getStorage(app)

// Dev emulators (uncomment if using Firebase Local Emulator Suite)
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099')
//   connectFirestoreEmulator(db, 'localhost', 8080)
//   connectStorageEmulator(storage, 'localhost', 9199)
// }

// Export configuration status check
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "YOUR_API_KEY"
)

export default app
