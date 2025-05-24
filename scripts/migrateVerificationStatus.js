/**
 * Migration script to add isVerified field to existing university documents
 * This script will update all existing universities to have isVerified: true
 * Run this once to migrate existing data
 */

import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

// Load environment variables
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Validate required environment variables
const requiredEnvVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateVerificationStatus() {
  console.log('🚀 Starting verification status migration...');
  
  try {
    // Get all universities
    const universitiesRef = collection(db, 'universities');
    const snapshot = await getDocs(universitiesRef);
    
    if (snapshot.empty) {
      console.log('❌ No universities found in database');
      return;
    }

    console.log(`📊 Found ${snapshot.size} universities to migrate`);
    
    // Use batch writes for efficiency
    const batch = writeBatch(db);
    let updatedCount = 0;
    let skippedCount = 0;

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      
      // Only update if isVerified field doesn't exist
      if (data.isVerified === undefined) {
        const docRef = doc(db, 'universities', docSnapshot.id);
        batch.update(docRef, {
          isVerified: true,
          verificationDate: new Date(),
          verificationStatus: 'approved'
        });
        updatedCount++;
        console.log(`✅ Queued update for: ${data.name || docSnapshot.id}`);
      } else {
        skippedCount++;
        console.log(`⏭️ Skipped (already has verification status): ${data.name || docSnapshot.id}`);
      }
    });

    if (updatedCount > 0) {
      // Commit the batch
      await batch.commit();
      console.log(`🎉 Migration completed successfully!`);
      console.log(`📈 Updated: ${updatedCount} universities`);
      console.log(`⏭️ Skipped: ${skippedCount} universities`);
    } else {
      console.log('ℹ️ No universities needed migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// For direct script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateVerificationStatus()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateVerificationStatus };
