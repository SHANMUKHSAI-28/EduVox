// Client-side university database population
// This can be imported and run from the browser console or a temporary page

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebaseConfig';

// University data for population
const universitiesData = [
  // US Universities
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
    programs_offered: ["Computer Science", "Medicine", "Law", "Business", "Engineering", "Liberal Arts"],
    description: "Harvard University is a private Ivy League research university in Cambridge, Massachusetts. Founded in 1636, it is the oldest institution of higher education in the United States.",
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
    programs_offered: ["Computer Science", "Engineering", "Business", "Medicine", "Artificial Intelligence"],
    description: "Stanford University is a private research university in Stanford, California. Known for its proximity to Silicon Valley and strong programs in technology and entrepreneurship.",
    website_url: "https://www.stanford.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Stanford-University-Logo.png",
    application_deadline: "January 2",
    acceptance_rate: 3.9,
    student_population: 17000,
    international_student_percentage: 23,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "Massachusetts Institute of Technology",
    country: "US",
    city: "Cambridge",
    state_province: "Massachusetts",
    type: "private",
    ranking_overall: 3,
    ranking_country: 3,
    tuition_min: 55510,
    tuition_max: 55510,
    currency: "USD",
    cgpa_requirement: 3.9,
    ielts_requirement: 7.0,
    toefl_requirement: 90,
    gre_requirement: 163,
    programs_offered: ["Engineering", "Computer Science", "Physics", "Mathematics", "Economics"],
    description: "MIT is a private research university known for its strong emphasis on scientific and technological research and innovation.",
    website_url: "https://www.mit.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/MIT-Logo.png",
    application_deadline: "January 1",
    acceptance_rate: 6.7,
    student_population: 11500,
    international_student_percentage: 30,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of California, Berkeley",
    country: "US",
    city: "Berkeley",
    state_province: "California",
    type: "public",
    ranking_overall: 22,
    ranking_country: 22,
    tuition_min: 14312,
    tuition_max: 46326,
    currency: "USD",
    cgpa_requirement: 3.7,
    ielts_requirement: 6.5,
    toefl_requirement: 80,
    gre_requirement: 155,
    programs_offered: ["Engineering", "Computer Science", "Business", "Liberal Arts", "Sciences"],
    description: "UC Berkeley is a public research university and the flagship institution of the University of California system.",
    website_url: "https://www.berkeley.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/UC-Berkeley-Logo.png",
    application_deadline: "November 30",
    acceptance_rate: 16.3,
    student_population: 45000,
    international_student_percentage: 18,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of California, Los Angeles",
    country: "US",
    city: "Los Angeles",
    state_province: "California",
    type: "public",
    ranking_overall: 20,
    ranking_country: 20,
    tuition_min: 13000,
    tuition_max: 44000,
    currency: "USD",
    cgpa_requirement: 3.6,
    ielts_requirement: 6.5,
    toefl_requirement: 87,
    gre_requirement: 155,
    programs_offered: ["Engineering", "Medicine", "Film", "Business", "Psychology"],
    description: "UCLA is a public research university in Los Angeles, known for its academic excellence and vibrant campus life.",
    website_url: "https://www.ucla.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/UCLA-Logo.png",
    application_deadline: "November 30",
    acceptance_rate: 12.3,
    student_population: 46000,
    international_student_percentage: 15,
    admin_approved: true,
    ai_generated: true
  },

  // UK Universities
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
    programs_offered: ["Medicine", "Law", "Philosophy", "History", "Engineering", "Sciences"],
    description: "The University of Oxford is the oldest university in the English-speaking world and one of the world's leading academic institutions.",
    website_url: "https://www.ox.ac.uk",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Oxford-University-Logo.png",
    application_deadline: "October 15",
    acceptance_rate: 17.5,
    student_population: 24000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Cambridge",
    country: "UK",
    city: "Cambridge",
    state_province: "England",
    type: "public",
    ranking_overall: 5,
    ranking_country: 2,
    tuition_min: 28000,
    tuition_max: 42000,
    currency: "GBP",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.5,
    toefl_requirement: 110,
    gre_requirement: null,
    programs_offered: ["Mathematics", "Engineering", "Natural Sciences", "Medicine", "Computer Science"],
    description: "The University of Cambridge is a collegiate research university known for its rigorous academic standards and historic traditions.",
    website_url: "https://www.cam.ac.uk",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Cambridge-University-Logo.png",
    application_deadline: "October 15",
    acceptance_rate: 21.0,
    student_population: 23000,
    international_student_percentage: 40,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "Imperial College London",
    country: "UK",
    city: "London",
    state_province: "England",
    type: "public",
    ranking_overall: 8,
    ranking_country: 3,
    tuition_min: 35000,
    tuition_max: 50000,
    currency: "GBP",
    cgpa_requirement: 3.7,
    ielts_requirement: 6.5,
    toefl_requirement: 92,
    gre_requirement: null,
    programs_offered: ["Engineering", "Medicine", "Natural Sciences", "Business"],
    description: "Imperial College London is a public research university focused on science, engineering, medicine and business.",
    website_url: "https://www.imperial.ac.uk",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Imperial-College-London-Logo.png",
    application_deadline: "January 15",
    acceptance_rate: 14.3,
    student_population: 19000,
    international_student_percentage: 60,
    admin_approved: true,
    ai_generated: true
  },

  // Canadian Universities
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
    gre_requirement: null,
    programs_offered: ["Engineering", "Medicine", "Business", "Arts & Sciences", "Computer Science"],
    description: "The University of Toronto is a public research university and one of the most prestigious universities in Canada.",
    website_url: "https://www.utoronto.ca",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/University-of-Toronto-Logo.png",
    application_deadline: "January 13",
    acceptance_rate: 43.0,
    student_population: 97000,
    international_student_percentage: 25,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "McGill University",
    country: "Canada",
    city: "Montreal",
    state_province: "Quebec",
    type: "public",
    ranking_overall: 31,
    ranking_country: 2,
    tuition_min: 20000,
    tuition_max: 30000,
    currency: "CAD",
    cgpa_requirement: 3.6,
    ielts_requirement: 6.5,
    toefl_requirement: 86,
    gre_requirement: null,
    programs_offered: ["Medicine", "Engineering", "Arts", "Sciences", "Business"],
    description: "McGill University is a public research university located in Montreal, Quebec, known for its medical school and research programs.",
    website_url: "https://www.mcgill.ca",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/McGill-University-Logo.png",
    application_deadline: "January 15",
    acceptance_rate: 46.3,
    student_population: 40000,
    international_student_percentage: 30,
    admin_approved: true,
    ai_generated: true
  },

  // Australian Universities
  {
    name: "Australian National University",
    country: "Australia",
    city: "Canberra",
    state_province: "Australian Capital Territory",
    type: "public",
    ranking_overall: 27,
    ranking_country: 1,
    tuition_min: 35000,
    tuition_max: 45000,
    currency: "AUD",
    cgpa_requirement: 3.5,
    ielts_requirement: 6.5,
    toefl_requirement: 80,
    gre_requirement: null,
    programs_offered: ["Arts & Social Sciences", "Engineering", "Medicine", "Sciences", "Business"],
    description: "The Australian National University is a public research university located in Canberra, the capital of Australia.",
    website_url: "https://www.anu.edu.au",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/ANU-Logo.png",
    application_deadline: "December 15",
    acceptance_rate: 35.0,
    student_population: 25000,
    international_student_percentage: 42,
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
    gre_requirement: null,
    programs_offered: ["Medicine", "Engineering", "Arts", "Sciences", "Business"],
    description: "The University of Melbourne is a public research university located in Melbourne, Victoria, and is Australia's second oldest university.",
    website_url: "https://www.unimelb.edu.au",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/University-of-Melbourne-Logo.png",
    application_deadline: "October 31",
    acceptance_rate: 70.0,
    student_population: 50000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Sydney",
    country: "Australia",
    city: "Sydney",
    state_province: "New South Wales",
    type: "public",
    ranking_overall: 38,
    ranking_country: 3,
    tuition_min: 28000,
    tuition_max: 38000,
    currency: "AUD",
    cgpa_requirement: 3.3,
    ielts_requirement: 6.5,
    toefl_requirement: 85,
    gre_requirement: null,
    programs_offered: ["Medicine", "Engineering", "Arts", "Sciences", "Business", "Law"],
    description: "The University of Sydney is Australia's first university and is ranked among the world's top universities.",
    website_url: "https://www.sydney.edu.au",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/University-of-Sydney-Logo.png",
    application_deadline: "January 31",
    acceptance_rate: 75.0,
    student_population: 52000,
    international_student_percentage: 40,
    admin_approved: true,
    ai_generated: true
  }
];

// Function to populate universities
export async function populateUniversities() {
  console.log('Starting university population...');
  
  try {
    let successCount = 0;
    const errors = [];
    
    for (const university of universitiesData) {
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
    
    console.log(`\n🎉 Population completed!`);
    console.log(`✅ Successfully added: ${successCount}/${universitiesData.length} universities`);
    
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
      errors.forEach(err => console.log(`   - ${err.university}: ${err.error}`));
    }
    
    return { success: successCount, errors };
    
  } catch (error) {
    console.error('❌ Failed to populate universities:', error);
    throw error;
  }
}

// Function that can be called from browser console
window.populateUniversityDatabase = populateUniversities;

console.log('University population script loaded! Run window.populateUniversityDatabase() to populate the database.');
