// Quick test script to populate universities directly
const dotenv = require('dotenv');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Load environment variables
dotenv.config();

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all Firebase configuration variables are set.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample universities data
const sampleUniversities = [
  {
    name: "Harvard University",
    country: "US",
    city: "Cambridge",
    state_province: "Massachusetts",
    type: "private",
    ranking_overall: 1,
    ranking_country: 1,
    tuition_min: 54000,
    tuition_max: 54000,
    currency: "USD",
    cgpa_requirement: 3.9,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    gre_requirement: 165,
    programs_offered: ["Computer Science", "Medicine", "Law", "Business", "Engineering"],
    description: "Harvard University is a private Ivy League research university in Cambridge, Massachusetts.",
    website_url: "https://www.harvard.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Harvard-Symbol.png",
    application_deadline: "January 1",
    acceptance_rate: 3.4,
    student_population: 23000,
    international_student_percentage: 25,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "Stanford University", 
    country: "US",
    city: "Stanford",
    state_province: "California",
    type: "private",
    ranking_overall: 2,
    ranking_country: 2,
    tuition_min: 56169,
    tuition_max: 56169,
    currency: "USD",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    gre_requirement: 165,
    programs_offered: ["Computer Science", "Engineering", "Medicine", "Business", "Physics"],
    description: "Stanford University is a private research university in Stanford, California.",
    website_url: "https://www.stanford.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Stanford-Logo.png",
    application_deadline: "January 2",
    acceptance_rate: 4.3,
    student_population: 17000,
    international_student_percentage: 23,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Toronto",
    country: "Canada", 
    city: "Toronto",
    state_province: "Ontario",
    type: "public",
    ranking_overall: 18,
    ranking_country: 1,
    tuition_min: 25000,
    tuition_max: 35000,
    currency: "CAD",
    cgpa_requirement: 3.6,
    ielts_requirement: 6.5,
    toefl_requirement: 89,
    gre_requirement: null,
    programs_offered: ["Engineering", "Medicine", "Business", "Arts & Sciences"],
    description: "The University of Toronto is a public research university and one of the most prestigious universities in Canada.",
    website_url: "https://www.utoronto.ca",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/University-of-Toronto-Logo.png",
    application_deadline: "January 13",
    acceptance_rate: 43.0,
    student_population: 97000,
    international_student_percentage: 25,
    admin_approved: true,
    ai_generated: true
  }
];

async function populateUniversities() {
  console.log('🚀 Starting university population...');
  
  try {
    let successCount = 0;
    const errors = [];
    
    for (const university of sampleUniversities) {
      try {
        const universityData = {
          ...university,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'universities'), universityData);
        console.log(`✅ Added: ${university.name} (ID: ${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${university.name}:`, error);
        errors.push({ university: university.name, error: error.message });
      }
    }
    
    console.log(`\n🎉 Successfully added ${successCount}/${sampleUniversities.length} universities!`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:', errors);
    }
    
  } catch (error) {
    console.error('💥 Failed to populate universities:', error);
  }
}

// Run the population script
populateUniversities().then(() => {
  console.log('✨ Population script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
