import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebaseConfig';
import subscriptionService from '../services/subscriptionService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Create user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = serverTimestamp();
      
      try {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: displayName || '',
          email,
          photoURL: photoURL || '',
          role: 'student', // Default role
          createdAt,
          updatedAt: createdAt,
          ...additionalData
        });

        // Create free tier subscription for new users
        await subscriptionService.createFreeSubscription(user.uid);
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    }
    
    // Fetch and set user data
    const updatedUserSnap = await getDoc(userRef);
    if (updatedUserSnap.exists()) {
      setUserData(updatedUserSnap.data());
    }

    // Fetch subscription data
    await loadSubscriptionData(user.uid);
  };

  // Load subscription data
  const loadSubscriptionData = async (userId) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      setSubscriptionData(subscription);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setSubscriptionData(null);
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    if (currentUser) {
      await loadSubscriptionData(currentUser.uid);
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      await createUserDocument(user, { displayName });
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await createUserDocument(user);
      return user;
    } catch (error) {
      throw error;
    }
  };  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setSubscriptionData(null);
    } catch (error) {
      throw error;
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);      if (user) {
        await createUserDocument(user);
      } else {
        setUserData(null);
        setSubscriptionData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);
  const value = {
    currentUser,
    userData,
    subscriptionData,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    refreshSubscription,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
