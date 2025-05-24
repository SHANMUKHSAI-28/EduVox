// Simple Node.js script to populate universities
// Run with: node scripts/populateDb.js

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
const serviceAccount = require('./serviceAccountKey.json'); // Download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();

// Sample universities data - this is a smaller set for quick testing
const universities = [
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
    programs_offered: ["Computer Science", "Engineering", "Business", "Medicine"],
    description: "Stanford University is a private research university in Stanford, California.",
    website_url: "https://www.stanford.edu",
    application_deadline: "January 2",
    acceptance_rate: 3.9,
    student_population: 17000,
    international_student_percentage: 23,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Oxford",
    country: "UK",
    city: "Oxford",
    state_province: "England",
    type: "public",
    ranking_overall: 3,
    ranking_country: 1,
    tuition_min: 30000,
    tuition_max: 45000,
    currency: "GBP",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    programs_offered: ["Medicine", "Law", "Philosophy", "History", "Engineering"],
    description: "The University of Oxford is the oldest university in the English-speaking world.",
    website_url: "https://www.ox.ac.uk",
    application_deadline: "October 15",
    acceptance_rate: 17.5,
    student_population: 24000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    state_province: "Ontario",
    type: "public",
    ranking_overall: 21,
    ranking_country: 1,
    tuition_min: 25000,
    tuition_max: 35000,
    currency: "CAD",
    cgpa_requirement: 3.7,
    ielts_requirement: 6.5,
    toefl_requirement: 89,
    programs_offered: ["Engineering", "Medicine", "Business", "Arts & Sciences"],
    description: "The University of Toronto is a public research university and one of the most prestigious universities in Canada.",
    website_url: "https://www.utoronto.ca",
    application_deadline: "January 13",
    acceptance_rate: 43.0,
    student_population: 97000,
    international_student_percentage: 25,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    state_province: "Victoria",
    type: "public",
    ranking_overall: 33,
    ranking_country: 2,
    tuition_min: 30000,
    tuition_max: 40000,
    currency: "AUD",
    cgpa_requirement: 3.4,
    ielts_requirement: 6.5,
    toefl_requirement: 79,
    programs_offered: ["Medicine", "Engineering", "Arts", "Sciences", "Business"],
    description: "The University of Melbourne is a public research university located in Melbourne, Victoria.",
    website_url: "https://www.unimelb.edu.au",
    application_deadline: "October 31",
    acceptance_rate: 70.0,
    student_population: 50000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true
  }
];

async function populateUniversities() {
  console.log('Starting university database population...');
  
  try {
    const batch = db.batch();
    
    for (const university of universities) {
      const docRef = db.collection('universities').doc();
      const universityData = {
        ...university,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(docRef, universityData);
      console.log(`Prepared: ${university.name}`);
    }
    
    await batch.commit();
    console.log(`Successfully added ${universities.length} universities to Firestore!`);
    
    // Exit the script
    process.exit(0);
  } catch (error) {
    console.error('Error populating universities:', error);
    process.exit(1);
  }
}

// Run the script
populateUniversities();
