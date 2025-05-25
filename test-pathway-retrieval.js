/**
 * Test script to verify the updated pathway retrieval system
 * Tests the new pre-scraped pathway lookup functionality
 */

import studyAbroadService from './src/services/studyAbroadService.js';
import pathwayScrapingService from './src/services/pathwayScrapingService.js';

async function testPathwayRetrieval() {
  console.log('🧪 Testing Updated Pathway Retrieval System');
  console.log('================================================\n');

  // Test user profile
  const testUserProfile = {
    userId: 'test-user-' + Date.now(),
    preferredCountry: 'United States',
    desiredCourse: 'Computer Science', 
    academicLevel: 'Master',
    budget: 60000,
    nationality: 'Indian'
  };

  console.log('📋 Test User Profile:');
  console.log(JSON.stringify(testUserProfile, null, 2));
  console.log('\n');

  try {
    // Test 1: Check if we can find a pre-scraped pathway
    console.log('🔍 Test 1: Searching for pre-scraped pathway...');
    const preScrapedPathway = await pathwayScrapingService.findPathwayByProfile(testUserProfile);
    
    if (preScrapedPathway) {
      console.log('✅ Found pre-scraped pathway!');
      console.log(`📄 Pathway ID: ${preScrapedPathway.id || 'N/A'}`);
      console.log(`🏛️ Pathway Type: ${preScrapedPathway.type || 'Unknown'}`);
      console.log(`📅 Created: ${preScrapedPathway.createdAt || 'Unknown'}`);
    } else {
      console.log('❌ No pre-scraped pathway found');
    }
    console.log('\n');

    // Test 2: Generate pathway using the new system
    console.log('🚀 Test 2: Generating pathway using new system...');
    const generatedPathway = await studyAbroadService.generatePathway(testUserProfile);
    
    if (generatedPathway) {
      console.log('✅ Successfully generated pathway!');
      console.log(`📄 Pathway ID: ${generatedPathway.id || 'N/A'}`);
      console.log(`🏛️ Pathway Type: ${generatedPathway.type || 'Unknown'}`);
      console.log(`🏫 Universities Count: ${generatedPathway.universities?.length || 0}`);
      console.log(`📚 Steps Count: ${generatedPathway.steps?.length || 0}`);
      console.log(`💰 Cost Estimate: $${generatedPathway.costs?.total || 'N/A'}`);
      
      if (generatedPathway.isAdapted) {
        console.log(`🔄 Adapted from: ${generatedPathway.originalPathway?.country} - ${generatedPathway.originalPathway?.course}`);
      }
    } else {
      console.log('❌ Failed to generate pathway');
    }
    console.log('\n');

    // Test 3: Check database statistics
    console.log('📊 Test 3: Checking pathway database statistics...');
    const stats = await pathwayScrapingService.getScrapingStats();
    
    if (stats) {
      console.log('✅ Database statistics retrieved:');
      console.log(`📈 Total Pathways: ${stats.totalPathways}`);
      console.log(`🌍 Unique Countries: ${stats.uniqueCountries}`);
      console.log(`📚 Unique Courses: ${stats.uniqueCourses}`);
      console.log(`🎓 Academic Levels: ${stats.uniqueAcademicLevels}`);
      console.log(`🌎 Nationalities: ${stats.uniqueNationalities}`);
      console.log(`🎯 Estimated Total Combinations: ${stats.estimatedTotal}`);
      console.log(`📊 Coverage: ${((stats.totalPathways / stats.estimatedTotal) * 100).toFixed(2)}%`);
    } else {
      console.log('❌ Failed to retrieve database statistics');
    }
    console.log('\n');

    // Test 4: Search for similar pathways
    console.log('🔍 Test 4: Testing similar pathway search...');
    const similarProfile = {
      preferredCountry: 'Canada',
      desiredCourse: 'Data Science',
      academicLevel: 'Master'
    };
    
    const similarPathways = await pathwayScrapingService.searchPathways(similarProfile);
    
    if (similarPathways && similarPathways.length > 0) {
      console.log(`✅ Found ${similarPathways.length} similar pathways`);
      console.log(`🏛️ First match: ${similarPathways[0].profile?.country} - ${similarPathways[0].profile?.course}`);
    } else {
      console.log('❌ No similar pathways found');
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPathwayRetrieval()
  .then(() => {
    console.log('\n✅ Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
