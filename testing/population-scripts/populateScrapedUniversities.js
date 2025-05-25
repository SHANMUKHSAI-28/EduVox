// Client-side university population using scraped data
// This can be imported and run from the browser console or admin panel

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebaseConfig.js';
import scrapedUniversities from '../data/scraped-universities.json' assert { type: 'json' };

export async function populateScrapedUniversities() {
  console.log('🔥 Starting population with scraped data...');
  console.log(`📊 Found ${scrapedUniversities.length} universities to populate`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const university of scrapedUniversities) {
    try {
      // Prepare data for Firestore
      const firestoreData = {
        ...university,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        // Ensure all required fields are present
        programs_offered: university.programs_offered || [],
        admin_approved: university.admin_approved || true,
        ai_generated: university.ai_generated || true
      };
      
      // Remove any undefined values
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined || firestoreData[key] === null) {
          delete firestoreData[key];
        }
      });
      
      const docRef = await addDoc(collection(db, 'universities'), firestoreData);
      successCount++;
      console.log(`✅ ${successCount}/${scrapedUniversities.length}: ${university.name} (${docRef.id})`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error adding ${university.name}:`, error);
    }
  }
  
  console.log(`\n🎉 Population completed!`);
  console.log(`✅ Successfully added: ${successCount} universities`);
  console.log(`❌ Errors: ${errorCount} universities`);
  
  return { successCount, errorCount, total: scrapedUniversities.length };
}

// Export for use in admin panel
window.populateScrapedUniversities = populateScrapedUniversities;
