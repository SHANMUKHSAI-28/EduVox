// Simple pathway test
import { initializeApp } from 'firebase/app';

console.log('Testing basic imports...');

try {
  console.log('✅ Firebase import successful');
  
  // Test the service import
  import('./src/services/studyAbroadService.js').then(service => {
    console.log('✅ Study abroad service import successful');
    console.log('Service methods available:', Object.keys(service.default));
    
    // Test simple pathway generation
    const testProfile = {
      userId: 'test-user-123',
      preferredCountry: 'United States',
      desiredCourse: 'Computer Science',
      academicLevel: 'Master',
      budget: { min: 40000, max: 80000 },
      currentGPA: 3.7,
      englishProficiency: { ielts: 7.5, toefl: 110 },
      standardizedTests: { gre: 330 },
      timeline: { targetIntake: 'fall', targetYear: '2025' },
      nationality: 'Indian',
      fullName: 'Test User'
    };
    
    console.log('🚀 Testing pathway generation...');
    return service.default.generatePathway(testProfile);
    
  }).then(pathway => {
    console.log('✅ Pathway generated successfully!');
    console.log('Pathway ID:', pathway.id);
    console.log('Country:', pathway.country);
    console.log('Course:', pathway.course);
    console.log('Steps:', pathway.steps?.length || 0);
    
  }).catch(error => {
    console.error('❌ Error testing pathway:', error);
  });
  
} catch (error) {
  console.error('❌ Import error:', error);
}
