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
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch(error => {
    console.error("Anonymous Sign-In Error:", error);
    toast({
        variant: 'destructive',
        title: 'Guest Sign In Failed',
        description: 'Could not sign in as a guest. Please try again.',
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password).catch(error => {
    let description = 'An unknown error occurred. Please try again.';
    switch (error.code) {
        case 'auth/email-already-in-use':
            description = 'This email is already in use by another account.';
            break;
        case 'auth/weak-password':
            description = 'The password is too weak. It must be at least 6 characters long.';
            break;
        case 'auth/invalid-email':
            description = 'The email address is not valid.';
            break;
        default:
            console.error("Email Sign-Up Error:", error);
    }
    toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password).catch(error => {
    let description = 'An unknown error occurred. Please try again.';
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        description = 'Invalid credentials. Please check your email and password.';
        break;
      case 'auth/invalid-email':
        description = 'The email address is not valid.';
        break;
      case 'auth/too-many-requests':
        description = 'Too many failed login attempts. Please try again later.';
        break;
      default:
        console.error("Email Sign-In Error:", error);
    }
    toast({
      variant: 'destructive',
      title: 'Sign In Failed',
      description: description,
    });
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
    if (error.code === 'auth/popup-closed-by-user') {
      toast({
        title: 'Sign In Cancelled',
        description: 'You closed the Google sign-in window.',
      });
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'An account already exists with this email. Please sign in with your original method.',
      });
    } else {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    }
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
