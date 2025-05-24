// Temporary script to populate sample universities
// This can be run in the browser console

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './src/firebaseConfig.js';

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
    ai_generated: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
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
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Stanford-University-Logo.png",
    application_deadline: "January 2",
    acceptance_rate: 3.9,
    student_population: 17000,
    international_student_percentage: 23,
    admin_approved: true,
    ai_generated: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    name: "University of Oxford",
    country: "UK",
    city: "Oxford",
    state_province: "England",
    type: "public",
    ranking_overall: 4,
    ranking_country: 1,
    tuition_min: 30000,
    tuition_max: 45000,
    currency: "GBP",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    gre_requirement: null,
    programs_offered: ["Medicine", "Law", "Philosophy", "History", "Engineering"],
    description: "The University of Oxford is the oldest university in the English-speaking world.",
    website_url: "https://www.ox.ac.uk",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Oxford-University-Logo.png",
    application_deadline: "October 15",
    acceptance_rate: 17.5,
    student_population: 24000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

// Function to populate universities
async function populateUniversities() {
  try {
    console.log('Starting to populate universities...');
    const universitiesRef = collection(db, 'universities');
    
    for (const university of sampleUniversities) {
      const docRef = await addDoc(universitiesRef, university);
      console.log(`Added university: ${university.name} with ID: ${docRef.id}`);
    }
    
    console.log('All universities added successfully!');
  } catch (error) {
    console.error('Error adding universities:', error);
  }
}

// Export for manual execution
window.populateUniversities = populateUniversities;
console.log('Run populateUniversities() to add sample data');
