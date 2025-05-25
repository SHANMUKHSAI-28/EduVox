/**
 * Test script to show the exact pathway data structure
 * This will generate one pathway and display its complete structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_AI_API_KEY);

async function generateSamplePathway() {
  console.log('🎯 Generating Sample Pathway to Show Data Structure');
  console.log('==================================================\n');

  const sampleProfile = {
    country: 'United States',
    course: 'Computer Science',
    academicLevel: 'Master',
    budgetRange: 'Medium',
    nationality: 'Indian'
  };

  console.log('📋 Sample Profile:');
  console.log(JSON.stringify(sampleProfile, null, 2));
  console.log('\n🤖 Generating pathway with Gemini AI...\n');

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate a comprehensive study abroad pathway for:
Country: ${sampleProfile.country}
Course: ${sampleProfile.course}
Academic Level: ${sampleProfile.academicLevel}
Budget Range: ${sampleProfile.budgetRange} ($25,000-$50,000)
Nationality: ${sampleProfile.nationality}

Please provide a detailed JSON response with:
1. University recommendations (top 5-8 universities)
2. Application timeline (12-month plan)
3. Required documents
4. Visa requirements
5. Scholarship opportunities
6. Cost breakdown
7. Language requirements
8. Admission requirements
9. Career prospects
10. Living information

Format as valid JSON with these exact keys:
{
  "universities": [
    {
      "name": "University Name",
      "ranking": "QS/Times ranking",
      "tuitionFee": "Annual fee in USD",
      "location": "City, State/Province",
      "requirements": {
        "gpa": "minimum GPA",
        "ielts": "minimum IELTS",
        "toefl": "minimum TOEFL",
        "gre": "required/not required",
        "gmat": "required/not required"
      },
      "specialties": ["specialty1", "specialty2"],
      "applicationDeadline": "deadline info"
    }
  ],
  "timeline": [
    {
      "month": "Month name",
      "tasks": ["task1", "task2", "task3"],
      "priority": "high/medium/low"
    }
  ],
  "documents": [
    {
      "name": "Document name",
      "description": "What it is and how to get it",
      "required": true
    }
  ],
  "visaRequirements": {
    "type": "visa type",
    "processingTime": "time in weeks",
    "fee": "fee in USD",
    "requirements": ["req1", "req2"]
  },
  "scholarships": [
    {
      "name": "Scholarship name",
      "amount": "amount or percentage",
      "eligibility": "who can apply",
      "deadline": "application deadline"
    }
  ],
  "costs": {
    "tuition": "annual tuition range",
    "living": "monthly living costs",
    "insurance": "health insurance cost",
    "other": "other expenses"
  },
  "languageRequirements": {
    "ielts": "minimum score",
    "toefl": "minimum score",
    "alternatives": ["other accepted tests"]
  },
  "careerProspects": {
    "averageSalary": "salary in USD",
    "jobMarket": "market condition",
    "topEmployers": ["company1", "company2"]
  },
  "livingInfo": {
    "climate": "climate description",
    "culture": "cultural info",
    "housing": "housing options and costs",
    "transportation": "transport info"
  }
}

Provide only the JSON response, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse the JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const pathwayData = JSON.parse(cleanedText);
      
      console.log('🎉 SUCCESS! Generated pathway data structure:\n');
      console.log('=====================================\n');
      
      // Display the structure in a organized way
      console.log('🏛️  UNIVERSITIES (' + (pathwayData.universities?.length || 0) + ' universities):');
      if (pathwayData.universities && pathwayData.universities.length > 0) {
        pathwayData.universities.forEach((uni, index) => {
          console.log(`   ${index + 1}. ${uni.name}`);
          console.log(`      📍 Location: ${uni.location}`);
          console.log(`      🏆 Ranking: ${uni.ranking}`);
          console.log(`      💰 Tuition: ${uni.tuitionFee}`);
          console.log(`      📋 Requirements: GPA ${uni.requirements?.gpa}, IELTS ${uni.requirements?.ielts}`);
          console.log(`      🎯 Specialties: ${uni.specialties?.join(', ')}`);
          console.log(`      📅 Deadline: ${uni.applicationDeadline}\n`);
        });
      }
      
      console.log('📅 TIMELINE (' + (pathwayData.timeline?.length || 0) + ' months):');
      if (pathwayData.timeline) {
        pathwayData.timeline.forEach((month, index) => {
          console.log(`   ${index + 1}. ${month.month} (${month.priority} priority)`);
          console.log(`      Tasks: ${month.tasks?.join(', ')}\n`);
        });
      }
      
      console.log('📄 REQUIRED DOCUMENTS (' + (pathwayData.documents?.length || 0) + ' documents):');
      if (pathwayData.documents) {
        pathwayData.documents.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.name} ${doc.required ? '(Required)' : '(Optional)'}`);
          console.log(`      ${doc.description}\n`);
        });
      }
      
      console.log('🛂 VISA REQUIREMENTS:');
      if (pathwayData.visaRequirements) {
        console.log(`   Type: ${pathwayData.visaRequirements.type}`);
        console.log(`   Processing Time: ${pathwayData.visaRequirements.processingTime}`);
        console.log(`   Fee: ${pathwayData.visaRequirements.fee}`);
        console.log(`   Requirements: ${pathwayData.visaRequirements.requirements?.join(', ')}\n`);
      }
      
      console.log('🎓 SCHOLARSHIPS (' + (pathwayData.scholarships?.length || 0) + ' opportunities):');
      if (pathwayData.scholarships) {
        pathwayData.scholarships.forEach((scholarship, index) => {
          console.log(`   ${index + 1}. ${scholarship.name}`);
          console.log(`      Amount: ${scholarship.amount}`);
          console.log(`      Eligibility: ${scholarship.eligibility}`);
          console.log(`      Deadline: ${scholarship.deadline}\n`);
        });
      }
      
      console.log('💰 COST BREAKDOWN:');
      if (pathwayData.costs) {
        console.log(`   Tuition: ${pathwayData.costs.tuition}`);
        console.log(`   Living: ${pathwayData.costs.living}`);
        console.log(`   Insurance: ${pathwayData.costs.insurance}`);
        console.log(`   Other: ${pathwayData.costs.other}\n`);
      }
      
      console.log('🗣️  LANGUAGE REQUIREMENTS:');
      if (pathwayData.languageRequirements) {
        console.log(`   IELTS: ${pathwayData.languageRequirements.ielts}`);
        console.log(`   TOEFL: ${pathwayData.languageRequirements.toefl}`);
        console.log(`   Alternatives: ${pathwayData.languageRequirements.alternatives?.join(', ')}\n`);
      }
      
      console.log('💼 CAREER PROSPECTS:');
      if (pathwayData.careerProspects) {
        console.log(`   Average Salary: ${pathwayData.careerProspects.averageSalary}`);
        console.log(`   Job Market: ${pathwayData.careerProspects.jobMarket}`);
        console.log(`   Top Employers: ${pathwayData.careerProspects.topEmployers?.join(', ')}\n`);
      }
      
      console.log('🏠 LIVING INFORMATION:');
      if (pathwayData.livingInfo) {
        console.log(`   Climate: ${pathwayData.livingInfo.climate}`);
        console.log(`   Culture: ${pathwayData.livingInfo.culture}`);
        console.log(`   Housing: ${pathwayData.livingInfo.housing}`);
        console.log(`   Transportation: ${pathwayData.livingInfo.transportation}\n`);
      }
      
      console.log('📊 SUMMARY:');
      console.log(`✅ Universities: ${pathwayData.universities?.length || 0}`);
      console.log(`✅ Timeline Steps: ${pathwayData.timeline?.length || 0}`);
      console.log(`✅ Documents: ${pathwayData.documents?.length || 0}`);
      console.log(`✅ Scholarships: ${pathwayData.scholarships?.length || 0}`);
      console.log(`✅ Complete pathway data generated successfully!`);
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI Response:');
      console.log(cleanedText);
    }
    
  } catch (error) {
    console.error('❌ Failed to generate pathway:', error);
  }
}

// Run the test
generateSamplePathway()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
