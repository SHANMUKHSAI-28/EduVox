// Test script for PDF export functionality
import { exportComparisonPDF } from './src/utils/pdfExport.js';

// Sample university data for testing
const testUniversities = [
  {
    name: "Harvard University",
    country: "US",
    city: "Cambridge",
    state_province: "Massachusetts",
    type: "private",
    ranking_overall: 1,
    tuition_min: 48697,
    tuition_max: 65796,
    currency: "USD",
    cgpa_requirement: 3.9,
    ielts_requirement: 7.5,
    toefl_requirement: 106,
    programs_offered: ["Business", "Physics", "Medicine", "Economics"],
    acceptance_rate: 8.1,
    website: "https://www.harvard.edu"
  },
  {
    name: "Stanford University",
    country: "US",
    city: "Stanford",
    state_province: "California",
    type: "private",
    ranking_overall: 2,
    tuition_min: 49420,
    tuition_max: 66513,
    currency: "USD",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.1,
    toefl_requirement: 101,
    programs_offered: ["Engineering", "Computer Science", "Business"],
    acceptance_rate: 4.3,
    website: "https://www.stanford.edu"
  },
  {
    name: "MIT",
    country: "US",
    city: "Cambridge",
    state_province: "Massachusetts",
    type: "private",
    ranking_overall: 3,
    tuition_min: 51520,
    tuition_max: 69600,
    currency: "USD",
    cgpa_requirement: 3.9,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    programs_offered: ["Engineering", "Technology", "Science"],
    acceptance_rate: 6.7,
    website: "https://www.mit.edu"
  },
  {
    name: "Oxford University",
    country: "UK",
    city: "Oxford",
    state_province: "England",
    type: "public",
    ranking_overall: 4,
    tuition_min: 30000,
    tuition_max: 45000,
    currency: "GBP",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.5,
    toefl_requirement: 110,
    programs_offered: ["Arts", "Sciences", "Medicine", "Law"],
    acceptance_rate: 15.9,
    website: "https://www.ox.ac.uk"
  },
  {
    name: "Cambridge University",
    country: "UK",
    city: "Cambridge",
    state_province: "England",
    type: "public",
    ranking_overall: 5,
    tuition_min: 28000,
    tuition_max: 42000,
    currency: "GBP",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.5,
    toefl_requirement: 110,
    programs_offered: ["Mathematics", "Sciences", "Engineering", "Arts"],
    acceptance_rate: 18.2,
    website: "https://www.cam.ac.uk"
  }
];

console.log('Testing PDF export with', testUniversities.length, 'universities...');

try {
  // Test the PDF export function
  const result = exportComparisonPDF(testUniversities, 'test@example.com');
  console.log('PDF export test completed successfully:', result);
} catch (error) {
  console.error('PDF export test failed:', error);
}
