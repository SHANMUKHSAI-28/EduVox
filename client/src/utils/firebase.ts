import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signUpWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);
export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);
export const onAuthStateChange = onAuthStateChanged;

// Database types
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'student' | 'consultant' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserAcademicProfile {
  user_id: string;
  cgpa: number | null;
  ielts_score: number | null;
  toefl_score: number | null;
  gre_score: number | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_countries: string[] | null;
  updated_at: string;
}

export interface University {
  id: number;
  name: string;
  country: string;
  state: string | null;
  city: string | null;
  type: 'public' | 'private';
  ranking: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  cgpa_requirement: number | null;
  ielts_requirement: number | null;
  toefl_requirement: number | null;
  gre_requirement: number | null;
  application_deadline: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface SavedUniversity {
  id: number;
  user_id: string;
  university_id: number;
  created_at: string;
  university?: University;
}

export default app;
