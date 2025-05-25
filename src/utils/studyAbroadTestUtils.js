// Test utilities for Study Abroad Pathway System
import studyAbroadService from '../services/studyAbroadService';

/**
 * Test pathway generation for different countries
 */
export const testPathwayGeneration = async () => {
  console.log('🧪 Testing Study Abroad Pathway Generation...\n');

  const testProfiles = [
    {
      name: 'Germany Computer Science Test',
      profile: {
        userId: 'test-user-germany',
        preferredCountry: 'Germany',
        desiredCourse: 'Computer Science',
        academicLevel: 'Master',
        budget: { min: 10000, max: 30000 },
        currentGPA: 3.5,
        englishProficiency: { ielts: 7.0, toefl: 100 },
        standardizedTests: { gre: 320 },
        timeline: { targetIntake: 'fall', targetYear: '2025' },
        nationality: 'Indian',
        fullName: 'Test User Germany'
      }
    },
    {
      name: 'USA Data Science Test',
      profile: {
        userId: 'test-user-usa',
        preferredCountry: 'United States',
        desiredCourse: 'Data Science',
        academicLevel: 'Master',
        budget: { min: 40000, max: 80000 },
        currentGPA: 3.7,
        englishProficiency: { ielts: 7.5, toefl: 110 },
        standardizedTests: { gre: 330 },
        timeline: { targetIntake: 'fall', targetYear: '2025' },
        nationality: 'Indian',
        fullName: 'Test User USA'
      }
    }
  ];

  const results = [];

  for (const test of testProfiles) {
    try {
      console.log(`📍 Testing: ${test.name}`);
      const pathway = await studyAbroadService.generatePathway(test.profile);
      
      console.log(`✅ Success: Generated pathway for ${test.profile.preferredCountry}`);
      console.log(`   - Steps: ${pathway.steps?.length || 0}`);
      console.log(`   - Universities: ${pathway.universities?.length || 0}`);
      console.log(`   - Country-specific data: ${pathway.countrySpecificInfo ? 'Present' : 'Missing'}`);
      console.log(`   - Test requirements: ${pathway.testRequirements ? 'Present' : 'Missing'}\n`);

      results.push({
        test: test.name,
        success: true,
        pathway: pathway
      });
    } catch (error) {
      console.error(`❌ Failed: ${test.name}`, error.message);
      results.push({
        test: test.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Test profile integration and pathway updates
 */
export const testProfileIntegration = async () => {
  console.log('🔄 Testing Profile Integration...\n');

  const userId = 'test-profile-integration';
  const oldCountries = ['United States'];
  const newCountries = ['Germany', 'Netherlands'];

  try {
    console.log('📍 Testing pathway update on profile change');
    const result = await studyAbroadService.updatePathwaysOnProfileChange(
      userId,
      oldCountries,
      newCountries
    );

    console.log(`✅ Profile integration test: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`   Message: ${result.message}\n`);

    return result;
  } catch (error) {
    console.error('❌ Profile integration test failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test history saving functionality
 */
export const testHistorySaving = async () => {
  console.log('💾 Testing History Saving...\n');

  const testPathway = {
    id: 'test-pathway',
    country: 'Germany',
    course: 'Computer Science',
    academicLevel: 'Master',
    steps: [
      { title: 'Test Step 1', status: 'completed' },
      { title: 'Test Step 2', status: 'in-progress' }
    ]
  };

  try {
    console.log('📍 Testing pathway save');
    await studyAbroadService.saveUserPathway('test-history-user', testPathway);
    
    console.log('📍 Testing pathway retrieval');
    const retrievedPathway = await studyAbroadService.getUserPathway('test-history-user');
    
    const success = retrievedPathway && retrievedPathway.id === testPathway.id;
    console.log(`✅ History saving test: ${success ? 'Success' : 'Failed'}\n`);

    return { success, retrievedPathway };
  } catch (error) {
    console.error('❌ History saving test failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('🚀 Running All Study Abroad System Tests...\n');
  
  const results = {
    pathwayGeneration: await testPathwayGeneration(),
    profileIntegration: await testProfileIntegration(),
    historySaving: await testHistorySaving()
  };

  console.log('📊 Test Summary:');
  console.log(`   Pathway Generation: ${results.pathwayGeneration.every(r => r.success) ? 'PASS' : 'FAIL'}`);
  console.log(`   Profile Integration: ${results.profileIntegration.success ? 'PASS' : 'FAIL'}`);
  console.log(`   History Saving: ${results.historySaving.success ? 'PASS' : 'FAIL'}\n`);

  return results;
};
