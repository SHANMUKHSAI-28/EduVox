/**
 * Client-side migration utility for adding verification status to universities
 * Can be called from admin panel or browser console
 */

import { collection, getDocs, doc, updateDoc, writeBatch, setDoc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export async function migrateUniversityVerificationStatus() {
  console.log('🚀 Starting client-side verification status migration...');
  
  try {
    // Get all universities
    const universitiesRef = collection(db, 'universities');
    const snapshot = await getDocs(universitiesRef);
    
    if (snapshot.empty) {
      console.log('❌ No universities found in database');
      return {
        success: false,
        message: 'No universities found',
        updated: 0,
        skipped: 0
      };
    }

    console.log(`📊 Found ${snapshot.size} universities to check`);
    
    const batch = writeBatch(db);
    let updatedCount = 0;
    let skippedCount = 0;
    const results = [];

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const universityName = data.name || 'Unknown University';
      
      // Only update if isVerified field doesn't exist
      if (data.isVerified === undefined) {
        const docRef = doc(db, 'universities', docSnapshot.id);
        batch.update(docRef, {
          isVerified: true,
          verificationDate: new Date().toISOString(),
          verificationStatus: 'approved',
          verificationMethod: 'migration'
        });
        updatedCount++;
        results.push({
          id: docSnapshot.id,
          name: universityName,
          action: 'updated'
        });
        console.log(`✅ Queued update for: ${universityName}`);
      } else {
        skippedCount++;
        results.push({
          id: docSnapshot.id,
          name: universityName,
          action: 'skipped',
          currentStatus: data.isVerified ? 'verified' : 'unverified'
        });
        console.log(`⏭️ Skipped (already has verification status): ${universityName}`);
      }
    });

    if (updatedCount > 0) {
      // Commit the batch
      await batch.commit();
      console.log(`🎉 Migration completed successfully!`);
      console.log(`📈 Updated: ${updatedCount} universities`);
      console.log(`⏭️ Skipped: ${skippedCount} universities`);
      
      return {
        success: true,
        message: `Migration completed: ${updatedCount} updated, ${skippedCount} skipped`,
        updated: updatedCount,
        skipped: skippedCount,
        results
      };
    } else {
      console.log('ℹ️ No universities needed migration');
      return {
        success: true,
        message: 'No universities needed migration',
        updated: 0,
        skipped: skippedCount,
        results
      };
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      updated: 0,
      skipped: 0,
      error: error.message
    };
  }
}

// Function to check current verification status of all universities
export async function checkVerificationStatus() {
  try {
    const universitiesRef = collection(db, 'universities');
    const snapshot = await getDocs(universitiesRef);
    
    if (snapshot.empty) {
      return {
        total: 0,
        verified: 0,
        unverified: 0,
        needsMigration: 0
      };
    }

    let verified = 0;
    let unverified = 0;
    let needsMigration = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isVerified === undefined) {
        needsMigration++;
      } else if (data.isVerified === true) {
        verified++;
      } else {
        unverified++;
      }
    });

    return {
      total: snapshot.size,
      verified,
      unverified,
      needsMigration
    };  } catch (error) {
    console.error('❌ Failed to check verification status:', error);
    throw error;
  }
}

/**
 * Updates a user's role to admin (client-side version)
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
 * Populate sample universities for testing
 */
export async function populateUniversities() {
  console.log('🚀 Starting university population...');
  
  try {
    const sampleUniversities = [
      {
        name: "Harvard University",
        country: "US",
        city: "Cambridge",
        state: "Massachusetts",
        type: "private",
        ranking_overall: 1,
        tuition_min: 54000,
        tuition_max: 54000,
        cgpa_requirement: 3.9,
        ielts_requirement: 7.0,
        toefl_requirement: 100,
        gre_requirement: 165,
        programs_offered: ["Computer Science", "Medicine", "Law", "Business", "Engineering", "Liberal Arts"],
        description: "Harvard University is a private Ivy League research university in Cambridge, Massachusetts.",
        website: "https://www.harvard.edu",
        application_deadline: "2025-01-01",
        acceptance_rate: 3.4,
        isVerified: true,
        admin_approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: "Stanford University",
        country: "US",
        city: "Stanford",
        state: "California",
        type: "private",
        ranking_overall: 2,
        tuition_min: 56169,
        tuition_max: 56169,
        cgpa_requirement: 3.8,
        ielts_requirement: 7.0,
        toefl_requirement: 100,
        gre_requirement: 165,
        programs_offered: ["Computer Science", "Engineering", "Business", "Medicine", "Artificial Intelligence"],
        description: "Stanford University is a private research university in Stanford, California.",
        website: "https://www.stanford.edu",
        application_deadline: "2025-01-03",
        acceptance_rate: 4.3,
        isVerified: true,
        admin_approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: "Massachusetts Institute of Technology",
        country: "US",
        city: "Cambridge",
        state: "Massachusetts",
        type: "private",
        ranking_overall: 3,
        tuition_min: 53790,
        tuition_max: 53790,
        cgpa_requirement: 3.9,
        ielts_requirement: 7.0,
        toefl_requirement: 100,
        gre_requirement: 165,
        programs_offered: ["Computer Science", "Engineering", "Physics", "Mathematics", "AI/ML"],
        description: "MIT is a private research university in Cambridge, Massachusetts focused on science and technology.",
        website: "https://web.mit.edu",
        application_deadline: "2025-01-01",
        acceptance_rate: 6.7,
        isVerified: true,
        admin_approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: "Oxford University",
        country: "UK",
        city: "Oxford",
        state: "England",
        type: "public",
        ranking_overall: 4,
        tuition_min: 35000,
        tuition_max: 45000,
        cgpa_requirement: 3.7,
        ielts_requirement: 7.5,
        toefl_requirement: 110,
        programs_offered: ["Medicine", "Law", "Literature", "Philosophy", "Sciences", "Engineering"],
        description: "The University of Oxford is a collegiate research university in Oxford, England.",
        website: "https://www.ox.ac.uk",
        application_deadline: "2025-01-15",
        acceptance_rate: 17.5,
        isVerified: true,
        admin_approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: "Cambridge University",
        country: "UK",
        city: "Cambridge",
        state: "England",
        type: "public",
        ranking_overall: 5,
        tuition_min: 33000,
        tuition_max: 43000,
        cgpa_requirement: 3.7,
        ielts_requirement: 7.5,
        toefl_requirement: 110,
        programs_offered: ["Medicine", "Engineering", "Computer Science", "Mathematics", "Natural Sciences"],
        description: "The University of Cambridge is a collegiate research university in Cambridge, England.",
        website: "https://www.cam.ac.uk",
        application_deadline: "2025-01-15",
        acceptance_rate: 21.0,
        isVerified: true,
        admin_approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    const universitiesRef = collection(db, 'universities');
    let addedCount = 0;

    for (const university of sampleUniversities) {
      try {
        await addDoc(universitiesRef, university);
        console.log(`✅ Added: ${university.name}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${university.name}:`, error);
      }
    }

    console.log(`🎉 Population completed! Added ${addedCount} universities`);
    
    return {
      success: true,
      message: `Successfully added ${addedCount} universities`,
      added: addedCount
    };

  } catch (error) {
    console.error('❌ University population failed:', error);
    return {
      success: false,
      message: `Failed to populate universities: ${error.message}`,
      added: 0
    };
  }
}
