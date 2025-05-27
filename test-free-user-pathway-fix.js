// Test script to debug free user pathway generation
const studyAbroadService = require('./src/services/studyAbroadService.js').default;

// Mock user profile for a free user
const freeUserProfile = {
  userId: 'test-free-user-id',
  userTier: 'free',
  preferredCountry: 'United Kingdom',
  desiredCourse: 'Computer Science',
  academicLevel: 'graduate',
  budget: 50000,
  currentGPA: 3.5,
  englishProficiency: 'advanced'
};

// Test pathway generation for free users
async function testFreeUserPathway() {
  console.log('🔍 Testing pathway generation for FREE user:', freeUserProfile);
  
  try {
    const pathway = await studyAbroadService.generatePathway(freeUserProfile);
    console.log('✅ Pathway generation result:', pathway ? 'SUCCESS' : 'FAILED');
    
    if (pathway) {
      console.log('📊 Pathway info:', {
        country: pathway.country,
        course: pathway.course,
        academicLevel: pathway.academicLevel,
        isPremiumContentLimited: pathway.isPremiumContentLimited,
        hasSteps: pathway.steps && pathway.steps.length > 0,
        stepsCount: pathway.steps?.length || 0
      });
    } else {
      console.error('❌ No pathway data returned!');
    }
  } catch (error) {
    console.error('❌ Error generating pathway:', error);
  }
}

// Run the test
testFreeUserPathway();
