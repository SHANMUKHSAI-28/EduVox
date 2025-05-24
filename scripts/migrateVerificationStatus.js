/**
 * Migration script to add isVerified field to existing university documents
 * This script will update all existing universities to have isVerified: true
 * Run this once to migrate existing data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

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
