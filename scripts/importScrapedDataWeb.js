// Import scraped university data into Firestore using web SDK
// Run with: node scripts/importScrapedDataWeb.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, connectFirestoreEmulator } from 'firebase/firestore';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importScrapedUniversities() {
  try {
    console.log('🔥 Starting Firestore import of scraped university data...');
    console.log(`📡 Connected to project: ${firebaseConfig.projectId}`);
    
    // Read the scraped data
    const dataPath = path.join(__dirname, '..', 'data', 'scraped-universities.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const universities = JSON.parse(rawData);
    
    console.log(`📊 Found ${universities.length} universities to import`);
    
    let importedCount = 0;
    
    for (const university of universities) {
      try {
        // Convert to Firestore-compatible format
        const firestoreData = {
          ...university,
          created_at: new Date(),
          updated_at: new Date(),
          // Ensure arrays are properly formatted
          programs_offered: university.programs_offered || [],
          // Ensure numeric fields are properly typed
          ranking_overall: Number(university.ranking_overall),
          ranking_country: Number(university.ranking_country),
          tuition_min: Number(university.tuition_min),
          tuition_max: Number(university.tuition_max),
          cgpa_requirement: Number(university.cgpa_requirement),
          ielts_requirement: Number(university.ielts_requirement),
          toefl_requirement: Number(university.toefl_requirement),
          gre_requirement: Number(university.gre_requirement),
          acceptance_rate: Number(university.acceptance_rate),
          student_population: Number(university.student_population),
          international_student_percentage: Number(university.international_student_percentage)
        };
        
        // Add document to Firestore
        const docRef = await addDoc(collection(db, 'universities'), firestoreData);
        importedCount++;
        
        console.log(`✅ ${importedCount}/${universities.length}: ${university.name} (ID: ${docRef.id})`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to import ${university.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Import completed successfully!`);
    console.log(`📊 Total universities imported: ${importedCount}/${universities.length}`);
    console.log(`🔥 All data is now available in Firestore`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Run the import
importScrapedUniversities()
  .then(() => {
    console.log('\n✅ Import process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import process failed:', error.message);
    process.exit(1);
  });
