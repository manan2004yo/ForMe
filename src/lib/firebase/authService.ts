// ============================================================
// FORME — Firebase Auth Service
// All authentication operations go through this service
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
  UserCredential,
  deleteUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from './config'

// ─── Auth State Observer ─────────────────────────────────────

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// ─── Sign Up with Email ───────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  rememberMe: boolean = true
): Promise<UserCredential> {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Update display name
  await updateProfile(credential.user, { displayName: name })
  
  // Send verification email
  await sendEmailVerification(credential.user)
  
  // Create user document in Firestore
  await createUserDocument(credential.user, { name })
  
  return credential
}

// ─── Sign In with Email ───────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<UserCredential> {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  return signInWithEmailAndPassword(auth, email, password)
}

// ─── Sign In with Google ──────────────────────────────────────

export async function signInWithGoogle(rememberMe: boolean = true): Promise<UserCredential> {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  const credential = await signInWithPopup(auth, googleProvider)
  
  // Create user document if it doesn't exist
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid))
  if (!userDoc.exists()) {
    await createUserDocument(credential.user, {
      name: credential.user.displayName || 'FORME User',
    })
  }
  
  return credential
}

// ─── Sign Out ─────────────────────────────────────────────────

export async function signOutUser(): Promise<void> {
  return signOut(auth)
}

// ─── Password Reset ───────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email)
}

// ─── Delete Account ───────────────────────────────────────────

export async function deleteUserAccount(): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error("No authenticated user")
  await deleteUser(user)
}

// ─── Create User Document in Firestore ───────────────────────

async function createUserDocument(
  user: User,
  additionalData: { name?: string }
) {
  const userRef = doc(db, 'users', user.uid)
  
  await setDoc(userRef, {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    name: additionalData.name || user.displayName || 'FORME User',
    avatar: user.photoURL || null,
    onboardingComplete: false,
    complexityMode: 'smart',
    preferredKatoriGrams: 150,
    mealFrequency: 3,
    trainingDays: [],
    gymClosedDays: [],
    availableEquipment: [],
    foodAvailability: [],
    allergies: '',
    physicalLimitations: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

// ─── Get Current User ─────────────────────────────────────────

export function getCurrentUser(): User | null {
  return auth.currentUser
}
