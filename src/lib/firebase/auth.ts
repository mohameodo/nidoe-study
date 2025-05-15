import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';

/**
 * Register a new user with email and password
 */
export const registerUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error during registration:', error);
    throw new Error(error.message || 'Failed to register user');
  }
};

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error during sign in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    return await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Error during sign out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
}; 