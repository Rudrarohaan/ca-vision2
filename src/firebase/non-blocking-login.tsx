'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch(error => {
    console.error("Anonymous Sign-In Error:", error);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password).catch(error => {
    // The form validation on the client should catch most input errors (like invalid email),
    // but this .catch() is important for handling server-side errors (e.g., email already in use)
    // or network issues without crashing the app.
    console.error("Email Sign-Up Error:", error.message);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password).catch(error => {
    // This will catch errors like wrong password, user not found, or network issues.
    console.error("Email Sign-In Error:", error.message);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // CRITICAL: Call signInWithPopup directly. Do NOT use 'await signInWithPopup(...)'.
  // We add a .catch() to handle cases where the user closes the popup, which
  // would otherwise cause an unhandled promise rejection.
  signInWithPopup(authInstance, provider).catch(error => {
    // Check for the specific error code for a closed popup.
    if (error.code === 'auth/popup-closed-by-user') {
      // This is a common user action and not a technical error.
      // We log a warning to the console instead of letting it crash the app.
      console.warn("Google Sign-in cancelled by user.");
    } else {
      // Log other, more serious errors.
      console.error("Google Sign-In Error:", error);
    }
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
