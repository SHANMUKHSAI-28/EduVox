// Import scraped university data into Firestore
// Run with: node scripts/importScrapedData.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const app = initializeApp({
  projectId: 'eduvox-cb8f0'
});

const db = getFirestore(app);

async function importScrapedUniversities() {
  try {
    console.log('🔥 Starting Firestore import of scraped university data...');
    
    // Read the scraped data
    const dataPath = path.join(__dirname, '..', 'data', 'scraped-universities.json');    const rawData = await fs.readFile(dataPath, 'utf8');
    // Clean JSON from comments before parsing
    const cleanData = rawData.replace(/\/\/.*?(\r?\n|$)/g, '$1').replace(/\/\*[\s\S]*?\*\//g, '');
    const universities = JSON.parse(cleanData);
    
    console.log(`📊 Found ${universities.length} universities to import`);
    
    // Import universities in batches
    const batchSize = 10;
    let importedCount = 0;
    
    for (let i = 0; i < universities.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = universities.slice(i, i + batchSize);
      
      console.log(`📝 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(universities.length/batchSize)}`);
      
      for (const university of currentBatch) {
        // Convert to Firestore-compatible format
        const firestoreData = {
          ...university,
          created_at: new Date(),
          updated_at: new Date(),
          // Convert arrays to proper format
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
        
        // Create document reference with auto-generated ID
        const docRef = db.collection('universities').doc();
        batch.set(docRef, firestoreData);
        
        importedCount++;
        console.log(`  ✅ Prepared: ${university.name}`);
      }
      
      // Commit the batch
      await batch.commit();
      console.log(`🔥 Batch ${Math.floor(i/batchSize) + 1} committed successfully`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Import completed successfully!`);
    console.log(`📊 Total universities imported: ${importedCount}`);
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
