/**
 * Admin User Setup Script
 * This script helps create admin users for the UniGuidePro system
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration - update with your config
const firebaseConfig = {
  apiKey: "AIzaSyCWTGUQYJe5uOy8yW8b9L9Z8fGJjEpNz9I",
  authDomain: "eduvox-50e95.firebaseapp.com",
  projectId: "eduvox-50e95",
  storageBucket: "eduvox-50e95.firebasestorage.app",
  messagingSenderId: "446436545232",
  appId: "1:446436545232:web:5b8e5e8c8c8c8c8c8c8c8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Updates a user's role to admin
 * @param {string} userEmail - The email of the user to make admin
 * @param {string} userId - The Firebase Auth UID of the user
 */
export async function makeUserAdmin(userEmail, userId) {
  try {
    console.log(`🔐 Setting up admin role for user: ${userEmail}`);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        uid: userId,
        email: userEmail,
        role: 'admin',
        displayName: userEmail.split('@')[0], // Default display name
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        adminSetupDate: serverTimestamp(),
        permissions: {
          manageUniversities: true,
          verifyUniversities: true,
          manageDatabases: true,
          viewAnalytics: true,
          manageUsers: true
        }
      });
      console.log(`✅ Created new admin user: ${userEmail}`);
    } else {
      // Update existing user to admin
      await setDoc(userRef, {
        role: 'admin',
        updatedAt: serverTimestamp(),
        adminSetupDate: serverTimestamp(),
        permissions: {
          manageUniversities: true,
          verifyUniversities: true,
          manageDatabases: true,
          viewAnalytics: true,
          manageUsers: true
        }
      }, { merge: true });
      console.log(`✅ Updated existing user to admin: ${userEmail}`);
    }
    
    return {
      success: true,
      message: `Successfully set up admin role for ${userEmail}`
    };
    
  } catch (error) {
    console.error('❌ Failed to setup admin user:', error);
    return {
      success: false,
      message: `Failed to setup admin user: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Lists all admin users in the system
 */
export async function listAdminUsers() {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('role', '==', 'admin'));
    const snapshot = await getDocs(adminQuery);
    
    const admins = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      admins.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        createdAt: data.createdAt?.toDate?.() || 'Unknown',
        adminSetupDate: data.adminSetupDate?.toDate?.() || 'Unknown'
      });
    });
    
    console.log(`📋 Found ${admins.length} admin users:`);
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.displayName || 'No display name'})`);
    });
    
    return admins;
    
  } catch (error) {
    console.error('❌ Failed to list admin users:', error);
    throw error;
  }
}

/**
 * Setup instructions for creating admin users
 */
export function getAdminSetupInstructions() {
  return `
🔐 Admin User Setup Instructions:

Method 1: Using Firebase Auth Console
1. Go to Firebase Console > Authentication > Users
2. Find the user you want to make admin
3. Copy their UID
4. Use the makeUserAdmin function with their email and UID

Method 2: Using the Admin Panel (after login)
1. Login to the system with any account
2. Go to Admin Panel > Database Maintenance
3. Use the "Setup Admin User" tool

Method 3: Manual Firestore Update
1. Go to Firebase Console > Firestore Database
2. Find the user document in the 'users' collection
3. Update the 'role' field to 'admin'
4. Add permissions object with admin permissions

Example Usage:
await makeUserAdmin('admin@example.com', 'firebase-auth-uid-here');
  `;
}

// For direct script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(getAdminSetupInstructions());
  
  // You can uncomment and modify this to set up an admin user
  // const adminEmail = 'your-admin@email.com';
  // const adminUid = 'firebase-auth-uid-here';
  // makeUserAdmin(adminEmail, adminUid)
  //   .then(result => {
  //     console.log(result.message);
  //     process.exit(result.success ? 0 : 1);
  //   });
}
