// Database CGPA Scale Conversion Script
// Converts CGPA requirements from 4.0 scale to 10.0 scale in Firestore database
// Run this script to update existing university data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to convert CGPA from 4.0 to 10.0 scale
const convertCGPA = (cgpa4Scale) => {
  if (!cgpa4Scale || cgpa4Scale <= 0) return cgpa4Scale;
  
  // Convert 4.0 scale to 10.0 scale
  // Formula: (CGPA_4.0 / 4.0) * 10.0 = CGPA_10.0
  return Math.round((cgpa4Scale / 4.0) * 10.0 * 100) / 100; // Round to 2 decimal places
};

// Function to check if CGPA is likely on 4.0 scale
const isOn4Scale = (cgpa) => {
  return cgpa && cgpa <= 4.0;
};

async function convertUniversitiesCGPA() {
  try {
    console.log('Starting university CGPA scale conversion...');
    
    // Get all universities
    const universitiesRef = collection(db, 'universities');
    const snapshot = await getDocs(universitiesRef);
    
    let totalUniversities = 0;
    let convertedUniversities = 0;
    
    for (const docSnapshot of snapshot.docs) {
      totalUniversities++;
      const universityData = docSnapshot.data();
      const currentCGPA = universityData.cgpa_requirement;
      
      // Check if CGPA needs conversion (is on 4.0 scale)
      if (isOn4Scale(currentCGPA)) {
        const newCGPA = convertCGPA(currentCGPA);
        
        console.log(`Converting ${universityData.name}: ${currentCGPA} -> ${newCGPA}`);
        
        // Update the university document
        await updateDoc(doc(db, 'universities', docSnapshot.id), {
          cgpa_requirement: newCGPA,
          updatedAt: new Date()
        });
        
        convertedUniversities++;
      } else {
        console.log(`Skipping ${universityData.name}: CGPA ${currentCGPA} already on 10.0 scale or invalid`);
      }
    }
    
    console.log(`\nUniversity conversion complete!`);
    console.log(`Total universities processed: ${totalUniversities}`);
    console.log(`Universities converted: ${convertedUniversities}`);
    console.log(`Universities skipped: ${totalUniversities - convertedUniversities}`);
    
    return { totalUniversities, convertedUniversities };
    
  } catch (error) {
    console.error('Error converting university CGPA scale:', error);
    throw error;
  }
}

// Also convert academic profiles if they exist
async function convertAcademicProfilesCGPA() {
  try {
    console.log('\nChecking academic profiles for CGPA conversion...');
    
    // Check if academic_profiles collection exists
    const profilesRef = collection(db, 'academic_profiles');
    const snapshot = await getDocs(profilesRef);
    
    if (snapshot.empty) {
      console.log('No academic profiles found');
      return { totalProfiles: 0, convertedProfiles: 0 };
    }
    
    let totalProfiles = 0;
    let convertedProfiles = 0;
    
    for (const docSnapshot of snapshot.docs) {
      totalProfiles++;
      const profileData = docSnapshot.data();
      const currentCGPA = profileData.cgpa;
      
      // Check if CGPA needs conversion (is on 4.0 scale)
      if (isOn4Scale(currentCGPA)) {
        const newCGPA = convertCGPA(currentCGPA);
        
        console.log(`Converting profile ${docSnapshot.id}: CGPA ${currentCGPA} -> ${newCGPA}`);
        
        // Update the profile document
        await updateDoc(doc(db, 'academic_profiles', docSnapshot.id), {
          cgpa: newCGPA,
          updatedAt: new Date()
        });
        
        convertedProfiles++;
      } else {
        console.log(`Skipping profile ${docSnapshot.id}: CGPA ${currentCGPA} already on 10.0 scale or invalid`);
      }
    }
    
    console.log(`\nAcademic profiles conversion complete!`);
    console.log(`Total profiles processed: ${totalProfiles}`);
    console.log(`Profiles converted: ${convertedProfiles}`);
    console.log(`Profiles skipped: ${totalProfiles - convertedProfiles}`);
    
    return { totalProfiles, convertedProfiles };
    
  } catch (error) {
    console.error('Error converting academic profiles CGPA:', error);
    throw error;
  }
}

// Run the complete conversion
async function runDatabaseCGPAConversion() {
  console.log('='.repeat(60));
  console.log('DATABASE CGPA SCALE CONVERSION SCRIPT');
  console.log('Converting from 4.0 scale to 10.0 scale');
  console.log('='.repeat(60));
  
  try {
    const universityResults = await convertUniversitiesCGPA();
    const profileResults = await convertAcademicProfilesCGPA();
    
    console.log('\n' + '='.repeat(60));
    console.log('CONVERSION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`Universities: ${universityResults.convertedUniversities}/${universityResults.totalUniversities} converted`);
    console.log(`Profiles: ${profileResults.convertedProfiles}/${profileResults.totalProfiles} converted`);
    console.log('='.repeat(60));
    
    return {
      success: true,
      universities: universityResults,
      profiles: profileResults
    };
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('CONVERSION FAILED');
    console.log('='.repeat(60));
    console.error('Error:', error.message);
    console.log('='.repeat(60));
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other modules
export { 
  convertUniversitiesCGPA, 
  convertAcademicProfilesCGPA, 
  runDatabaseCGPAConversion,
  convertCGPA,
  isOn4Scale
};

// For browser console usage
if (typeof window !== 'undefined') {
  window.runDatabaseCGPAConversion = runDatabaseCGPAConversion;
  console.log('Database CGPA conversion script loaded. Run window.runDatabaseCGPAConversion() to execute.');
}
