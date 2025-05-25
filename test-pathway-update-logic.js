// Test script to verify the new pathway update logic
// This script tests that pathways are updated for same country, new ones created for different countries

import studyAbroadService from './src/services/studyAbroadService.js';

const testUserId = 'test-pathway-update-user';

// Test profile for USA
const testProfileUSA = {
  userId: testUserId,
  preferredCountry: 'United States',
  desiredCourse: 'Computer Science',
  academicLevel: 'Master',
  budget: { min: 40000, max: 80000 },
  currentGPA: 3.7,
  englishProficiency: { ielts: 7.5, toefl: 110 },
  standardizedTests: { gre: 330 },
  timeline: { targetIntake: 'fall', targetYear: '2025' },
  nationality: 'Indian',
  fullName: 'Test User USA'
};

// Updated test profile for USA (same country, different course)
const testProfileUSAUpdated = {
  userId: testUserId,
  preferredCountry: 'United States',
  desiredCourse: 'Data Science', // Changed course
  academicLevel: 'Master',
  budget: { min: 50000, max: 90000 }, // Changed budget
  currentGPA: 3.8, // Improved GPA
  englishProficiency: { ielts: 7.5, toefl: 110 },
  standardizedTests: { gre: 335 }, // Improved GRE
  timeline: { targetIntake: 'fall', targetYear: '2025' },
  nationality: 'Indian',
  fullName: 'Test User USA'
};

// Test profile for Germany (different country)
const testProfileGermany = {
  userId: testUserId,
  preferredCountry: 'Germany',
  desiredCourse: 'Computer Science',
  academicLevel: 'Master',
  budget: { min: 15000, max: 30000 },
  currentGPA: 3.7,
  englishProficiency: { ielts: 7.0, toefl: 100 },
  standardizedTests: { gre: 320 },
  timeline: { targetIntake: 'fall', targetYear: '2025' },
  nationality: 'Indian',
  fullName: 'Test User Germany'
};

async function runPathwayUpdateTest() {
  console.log('🚀 Testing Pathway Update Logic...\n');

  try {
    // Step 1: Create initial pathway for USA
    console.log('📍 Step 1: Creating initial pathway for USA...');
    const pathway1 = await studyAbroadService.generatePathway(testProfileUSA);
    console.log(`✅ Created pathway: ${pathway1.id}`);
    console.log(`   Country: ${pathway1.country}`);
    console.log(`   Course: ${pathway1.course}`);

    // Get all pathways for user
    const pathways1 = await studyAbroadService.getUserPathways(testUserId);
    console.log(`   Total pathways after step 1: ${pathways1.length}\n`);

    // Step 2: Update pathway for USA (same country, different course)
    console.log('📍 Step 2: Updating pathway for USA (same country, different course)...');
    const pathway2 = await studyAbroadService.generatePathway(testProfileUSAUpdated);
    console.log(`✅ Updated pathway: ${pathway2.id}`);
    console.log(`   Country: ${pathway2.country}`);
    console.log(`   Course: ${pathway2.course}`);

    // Get all pathways for user
    const pathways2 = await studyAbroadService.getUserPathways(testUserId);
    console.log(`   Total pathways after step 2: ${pathways2.length}`);
    
    // Verify: Should still be 1 pathway (updated, not new)
    if (pathways2.length === 1) {
      console.log('✅ PASS: Pathway was updated, not duplicated');
      console.log(`   Updated course: ${pathways2[0].course}`);
    } else {
      console.log('❌ FAIL: Expected 1 pathway, found ' + pathways2.length);
    }
    console.log('');

    // Step 3: Create pathway for Germany (different country)
    console.log('📍 Step 3: Creating pathway for Germany (different country)...');
    const pathway3 = await studyAbroadService.generatePathway(testProfileGermany);
    console.log(`✅ Created pathway: ${pathway3.id}`);
    console.log(`   Country: ${pathway3.country}`);
    console.log(`   Course: ${pathway3.course}`);

    // Get all pathways for user
    const pathways3 = await studyAbroadService.getUserPathways(testUserId);
    console.log(`   Total pathways after step 3: ${pathways3.length}`);
    
    // Verify: Should now be 2 pathways (USA + Germany)
    if (pathways3.length === 2) {
      console.log('✅ PASS: New pathway created for different country');
      const countries = pathways3.map(p => p.country);
      console.log(`   Countries: ${countries.join(', ')}`);
    } else {
      console.log('❌ FAIL: Expected 2 pathways, found ' + pathways3.length);
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   Final pathway count: ${pathways3.length}`);
    pathways3.forEach((pathway, index) => {
      console.log(`   Pathway ${index + 1}: ${pathway.country} - ${pathway.course}`);
      console.log(`     Created: ${new Date(pathway.createdAt).toLocaleString()}`);
      console.log(`     Updated: ${new Date(pathway.updatedAt).toLocaleString()}`);
    });

    return {
      success: true,
      pathwayCount: pathways3.length,
      pathways: pathways3
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runPathwayUpdateTest().then(result => {
  console.log('\n🎯 Test Result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.error) {
    console.log('Error:', result.error);
  }
});
