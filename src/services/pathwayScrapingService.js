/**
 * Pathway Scraping Service
 * Uses Gemini AI to generate comprehensive study abroad pathways for all possible combinations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../firebaseConfig.js';
import { collection, doc, setDoc, getDocs, query, where, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

class PathwayScrapingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Define all possible combinations for pathway generation
    this.countries = [
      'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
      'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
      'New Zealand', 'Ireland', 'Italy', 'Spain', 'Belgium', 'Austria',
      'Finland', 'Japan', 'South Korea', 'Singapore'
    ];
    
    this.courses = [
      'Computer Science', 'Data Science', 'Artificial Intelligence', 'Software Engineering',
      'Business Administration', 'Finance', 'Marketing', 'International Business',
      'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering',
      'Medicine', 'Nursing', 'Public Health', 'Pharmacy',
      'Psychology', 'International Relations', 'Economics', 'Political Science',
      'Environmental Science', 'Biotechnology', 'Chemistry', 'Physics',
      'Architecture', 'Design', 'Fine Arts', 'Media Studies',
      'Education', 'Law', 'Social Work', 'Journalism'
    ];
    
    this.academicLevels = ['Bachelor', 'Master', 'PhD'];
    
    this.budgetRanges = [
      { name: 'Low', min: 10000, max: 25000 },
      { name: 'Medium', min: 25000, max: 50000 },
      { name: 'High', min: 50000, max: 100000 },
      { name: 'Premium', min: 100000, max: 200000 }
    ];
    
    this.nationalities = [
      'Indian', 'Chinese', 'Pakistani', 'Bangladeshi', 'Nigerian', 'Brazilian',
      'Mexican', 'Turkish', 'Egyptian', 'Iranian', 'Vietnamese', 'Indonesian',
      'Malaysian', 'Thai', 'Filipino', 'Sri Lankan', 'Nepalese', 'Afghan'
    ];
  }

  /**
   * Generate pathway using Gemini AI
   */
  async generatePathwayWithAI(profile) {
    try {
      const prompt = `
Generate a comprehensive study abroad pathway for:
- Country: ${profile.country}
- Course: ${profile.course}
- Academic Level: ${profile.academicLevel}
- Budget Range: $${profile.budgetRange.min} - $${profile.budgetRange.max}
- Nationality: ${profile.nationality}

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
      "required": true/false
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
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the JSON response
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw response:', text);
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      console.error('Error generating pathway with AI:', error);
      throw error;
    }
  }

  /**
   * Generate a unique pathway ID based on profile
   */
  generatePathwayId(profile) {
    return `${profile.country}_${profile.course}_${profile.academicLevel}_${profile.budgetRange.name}_${profile.nationality}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Save pathway to Firestore
   */
  async savePathwayToDatabase(profile, pathwayData) {
    try {
      const pathwayId = this.generatePathwayId(profile);
      const pathwayRef = doc(db, 'pathways', pathwayId);
      
      const pathwayDoc = {
        id: pathwayId,
        profile: {
          country: profile.country,
          course: profile.course,
          academicLevel: profile.academicLevel,
          budgetRange: profile.budgetRange,
          nationality: profile.nationality
        },
        data: pathwayData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        version: '1.0'
      };
      
      await setDoc(pathwayRef, pathwayDoc);
      console.log(`✅ Pathway saved: ${pathwayId}`);
      return pathwayId;
    } catch (error) {
      console.error('Error saving pathway to database:', error);
      throw error;
    }
  }

  /**
   * Generate all possible pathway combinations
   */
  async scrapeAllPathways(onProgress) {
    const totalCombinations = this.countries.length * this.courses.length * 
                            this.academicLevels.length * this.budgetRanges.length * 
                            this.nationalities.length;
    
    console.log(`🚀 Starting pathway scraping for ${totalCombinations} combinations...`);
    
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    // Add delay between requests to avoid rate limiting
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const country of this.countries) {
      for (const course of this.courses) {
        for (const academicLevel of this.academicLevels) {
          for (const budgetRange of this.budgetRanges) {
            for (const nationality of this.nationalities) {
              const profile = {
                country,
                course,
                academicLevel,
                budgetRange,
                nationality
              };

              const pathwayId = this.generatePathwayId(profile);
              
              try {
                // Check if pathway already exists
                const existingDoc = await this.getPathwayFromDatabase(pathwayId);
                if (existingDoc) {
                  results.skipped.push(pathwayId);
                  completed++;
                  if (onProgress) {
                    onProgress({
                      total: totalCombinations,
                      completed,
                      successful,
                      failed,
                      current: pathwayId,
                      status: 'skipped'
                    });
                  }
                  continue;
                }

                // Generate pathway with AI
                console.log(`🔄 Generating pathway: ${pathwayId}`);
                const pathwayData = await this.generatePathwayWithAI(profile);
                
                // Save to database
                await this.savePathwayToDatabase(profile, pathwayData);
                
                results.successful.push(pathwayId);
                successful++;
                
                // Rate limiting delay (2 seconds between requests)
                await delay(2000);
                
              } catch (error) {
                console.error(`❌ Failed to generate pathway: ${pathwayId}`, error);
                results.failed.push({ id: pathwayId, error: error.message });
                failed++;
              }
              
              completed++;
              
              // Report progress
              if (onProgress) {
                onProgress({
                  total: totalCombinations,
                  completed,
                  successful,
                  failed,
                  current: pathwayId,
                  status: completed === totalCombinations ? 'completed' : 'processing'
                });
              }
              
              // Log progress every 10 items
              if (completed % 10 === 0) {
                console.log(`📊 Progress: ${completed}/${totalCombinations} (${((completed/totalCombinations)*100).toFixed(1)}%)`);
              }
            }
          }
        }
      }
    }

    console.log(`✅ Pathway scraping completed!`);
    console.log(`📊 Results: ${successful} successful, ${failed} failed, ${results.skipped.length} skipped`);
    
    return results;
  }

  /**
   * Get pathway from database
   */
  async getPathwayFromDatabase(pathwayId) {
    try {
      const pathwayRef = doc(db, 'pathways', pathwayId);
      const pathwaySnap = await getDoc(pathwayRef);
      
      if (pathwaySnap.exists()) {
        return pathwaySnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching pathway from database:', error);
      return null;
    }
  }  /**
   * Find pathway by user profile
   */
  async findPathwayByProfile(userProfile) {
    try {
      // Convert user profile to our standard format
      const budgetRangeObj = this.getBudgetRangeFromAmount(userProfile.budget || 50000);
      
      const searchProfile = {
        country: userProfile.preferredCountry,
        course: userProfile.desiredCourse,
        academicLevel: userProfile.academicLevel,
        budgetRange: budgetRangeObj,
        nationality: userProfile.nationality || 'Indian' // Default to Indian nationality
      };
      
      const pathwayId = this.generatePathwayId(searchProfile);
      return await this.getPathwayFromDatabase(pathwayId);
    } catch (error) {
      console.error('Error finding pathway by profile:', error);
      return null;
    }
  }

  /**
   * Convert budget amount to budget range category
   */
  getBudgetRangeFromAmount(budget) {
    const amount = typeof budget === 'object' ? budget.max : budget;
    
    for (const range of this.budgetRanges) {
      if (amount >= range.min && amount <= range.max) {
        return range;
      }
    }
    
    // Default to high range if amount is very high
    return this.budgetRanges[2]; // High range
  }
  /**
   * Get scraping statistics
   */
  async getScrapingStats() {
    try {
      const pathwaysRef = collection(db, 'pathways');
      const snapshot = await getDocs(pathwaysRef);
      
      const stats = {
        totalPathways: snapshot.size,
        countries: new Set(),
        courses: new Set(),
        academicLevels: new Set(),
        nationalities: new Set()
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.profile) {
          stats.countries.add(data.profile.country);
          stats.courses.add(data.profile.course);
          stats.academicLevels.add(data.profile.academicLevel);
          stats.nationalities.add(data.profile.nationality);
        }
      });
      
      return {
        totalPathways: stats.totalPathways,
        uniqueCountries: stats.countries.size,
        uniqueCourses: stats.courses.size,
        uniqueAcademicLevels: stats.academicLevels.size,
        uniqueNationalities: stats.nationalities.size,
        estimatedTotal: this.countries.length * this.courses.length * 
                       this.academicLevels.length * this.budgetRanges.length * 
                       this.nationalities.length
      };
    } catch (error) {
      console.error('Error getting scraping stats:', error);
      return null;
    }
  }

  /**
   * Search for pathways by criteria (for finding similar pathways)
   */
  async searchPathways(criteria) {
    try {
      let pathwaysQuery = collection(db, 'pathways');
      
      // Build query based on criteria
      const queryConditions = [];
      
      if (criteria.country) {
        queryConditions.push(where('profile.country', '==', criteria.country));
      }
      
      if (criteria.course) {
        queryConditions.push(where('profile.course', '==', criteria.course));
      }
      
      if (criteria.academicLevel) {
        queryConditions.push(where('profile.academicLevel', '==', criteria.academicLevel));
      }
      
      if (criteria.nationality) {
        queryConditions.push(where('profile.nationality', '==', criteria.nationality));
      }
      
      if (criteria.budgetRange) {
        queryConditions.push(where('profile.budgetRange', '==', criteria.budgetRange));
      }
      
      // Apply query conditions
      if (queryConditions.length > 0) {
        pathwaysQuery = query(pathwaysQuery, ...queryConditions);
      }
      
      const snapshot = await getDocs(pathwaysQuery);
      const results = [];
      
      snapshot.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return results;
    } catch (error) {
      console.error('Error searching pathways:', error);
      return null;
    }
  }
}

export default new PathwayScrapingService();
