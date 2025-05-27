import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import pathwayScrapingService from './pathwayScrapingService.js';

// Study Abroad Service for UniGuidePro Feature
class StudyAbroadService {
  constructor() {
    this.pathwaysCollection = 'studyAbroadPathways';
    this.userPathwaysCollection = 'userStudyAbroadPathways';
  }  /**
   * Retrieve a pre-scraped study abroad pathway from database
   * @param {Object} userProfile - User's academic and preference data
   * @returns {Object} - Complete study abroad pathway from pre-scraped database
   */
  async generatePathway(userProfile) {
    try {
      const {
        userId,
        preferredCountry,
        desiredCourse,
        academicLevel,
        nationality = 'Indian', // Default nationality
        budgetRange = 'medium' // Default budget range
      } = userProfile;

      console.log('Fetching pre-scraped pathway for:', { 
        userId, 
        preferredCountry, 
        desiredCourse, 
        academicLevel,
        nationality,
        budgetRange 
      });      // Try to get pre-scraped pathway from database
      const preScrapedPathway = await pathwayScrapingService.findPathwayByProfile(userProfile);

      if (preScrapedPathway) {
        console.log('Found pre-scraped pathway in database');
        
        // Personalize the pathway for the user
        const personalizedPathway = await this.personalizePathway(preScrapedPathway, userProfile);
        
        // Save to user's pathways
        await this.saveUserPathway(userId, personalizedPathway);
        
        return personalizedPathway;
      }

      // If no exact match found, try to find similar pathways
      console.log('No exact match found, searching for similar pathways...');
      const similarPathways = await this.findSimilarPathways(userProfile);
      
      if (similarPathways && similarPathways.length > 0) {
        console.log('Found similar pathway, adapting for user');
        const adaptedPathway = await this.adaptSimilarPathway(similarPathways[0], userProfile);
        await this.saveUserPathway(userId, adaptedPathway);
        return adaptedPathway;
      }      // Use AI generation as fallback when database is empty
      console.log('No similar pathways found, generating with AI...');
      const aiGeneratedPathway = await this.generatePathwayWithAI(userProfile);
      
      if (aiGeneratedPathway) {
        // Store full pathway in database for future use
        await this.savePathwayTemplate(aiGeneratedPathway);
        await this.saveUserPathway(userId, aiGeneratedPathway);
        
        // Return limited or full pathway based on user subscription
        const userTier = userProfile.userTier || 'free';
        if (userTier === 'free') {
          return this.createLimitedPathwayForFreeUsers(aiGeneratedPathway);
        }
        
        return aiGeneratedPathway;
      }
      
      // Last resort: create basic fallback pathway if AI fails
      console.log('AI generation failed, creating basic fallback');
      const fallbackPathway = await this.createBasicFallbackPathway(userProfile);
      await this.saveUserPathway(userId, fallbackPathway);
      
      return fallbackPathway;    } catch (error) {
      console.error('Error fetching study abroad pathway:', error);
      
      // Emergency fallback - try AI generation first
      try {
        console.log('Attempting emergency AI fallback pathway generation');
        const aiEmergencyPathway = await this.generatePathwayWithAI(userProfile);
        
        if (aiEmergencyPathway) {
          // Store full pathway in database for future use
          await this.savePathwayTemplate(aiEmergencyPathway);
          await this.saveUserPathway(userProfile.userId, aiEmergencyPathway);
          
          // Return limited or full pathway based on user subscription
          const userTier = userProfile.userTier || 'free';
          if (userTier === 'free') {
            return this.createLimitedPathwayForFreeUsers(aiEmergencyPathway);
          }
          
          return aiEmergencyPathway;
        }
        
        // If AI generation fails, use basic fallback
        console.log('Emergency AI generation failed, using basic fallback');
        const emergencyPathway = await this.createBasicFallbackPathway(userProfile);
        await this.saveUserPathway(userProfile.userId, emergencyPathway);
        return emergencyPathway;
      } catch (fallbackError) {
        console.error('All emergency fallbacks failed:', fallbackError);
        throw new Error('Failed to retrieve study abroad pathway');
      }
    }
  }

  /**
   * Generate a unique pathway ID
   */
  generatePathwayId(country, course, level) {
    return `${country.toLowerCase()}_${course.toLowerCase().replace(/\s+/g, '_')}_${level.toLowerCase()}`;
  }
  /**
   * Check if pathway already exists in Firestore
   */
  async getExistingPathway(pathwayId) {
    try {
      const pathwayDoc = await getDoc(doc(db, this.pathwaysCollection, pathwayId));
      return pathwayDoc.exists() ? { id: pathwayDoc.id, ...pathwayDoc.data() } : null;
    } catch (error) {
      console.error('Error fetching existing pathway:', error);
      return null;
    }
  }

  /**
   * Find similar pathways when exact match is not found
   */
  async findSimilarPathways(userProfile) {
    try {
      const { preferredCountry, desiredCourse, academicLevel } = userProfile;
      
      // Try different combinations to find similar pathways
      const searchCriteria = [
        // Same country and course, different level
        { country: preferredCountry, course: desiredCourse },
        // Same country and level, different course  
        { country: preferredCountry, academicLevel: academicLevel },
        // Same course and level, different country
        { course: desiredCourse, academicLevel: academicLevel },
        // Same country only
        { country: preferredCountry }
      ];

      for (const criteria of searchCriteria) {
        const pathways = await pathwayScrapingService.searchPathways(criteria);
        if (pathways && pathways.length > 0) {
          return pathways;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding similar pathways:', error);
      return null;
    }
  }

  /**
   * Adapt a similar pathway for the user's specific requirements
   */
  async adaptSimilarPathway(similarPathway, userProfile) {
    try {
      console.log('Adapting similar pathway for user requirements');
      
      // Create a copy of the similar pathway
      const adaptedPathway = JSON.parse(JSON.stringify(similarPathway));
      
      // Update basic info to match user profile
      adaptedPathway.country = userProfile.preferredCountry;
      adaptedPathway.course = userProfile.desiredCourse;
      adaptedPathway.academicLevel = userProfile.academicLevel;
      adaptedPathway.nationality = userProfile.nationality || 'Indian';
      adaptedPathway.budgetRange = userProfile.budgetRange || 'medium';
      
      // Add adaptation note
      adaptedPathway.adaptationNote = `Adapted from similar pathway for ${similarPathway.country} - ${similarPathway.course}`;
      adaptedPathway.isAdapted = true;
      adaptedPathway.originalPathway = {
        country: similarPathway.country,
        course: similarPathway.course,
        academicLevel: similarPathway.academicLevel
      };
      
      // Update timestamps
      adaptedPathway.adaptedAt = new Date().toISOString();
      adaptedPathway.lastUpdated = new Date().toISOString();
      
      // Personalize for the user
      return await this.personalizePathway(adaptedPathway, userProfile);
      
    } catch (error) {
      console.error('Error adapting similar pathway:', error);
      throw error;
    }
  }/**
   * Create a new comprehensive study abroad pathway (STATIC ONLY, AI REMOVED)
   */
  createNewPathway(userProfile) {
    // Only use static pathway logic
    return this.createStaticPathway(userProfile);
  }
  /**
   * Create a static study abroad pathway based on user profile
   */
  async createStaticPathway(userProfile) {
    const {
      preferredCountry = 'United States',
      desiredCourse = 'Computer Science',
      academicLevel = 'graduate',
      userId
    } = userProfile;

    // Generate pathway ID
    const pathwayId = this.generatePathwayId(preferredCountry, desiredCourse, academicLevel);

    try {
      // Generate all pathway components and await them properly
      const [
        steps,
        requirements,
        costs,
        universities,
        visa,
        career,
        scholarships
      ] = await Promise.all([
        this.generatePathwaySteps(userProfile),
        this.generateRequirements(preferredCountry, desiredCourse),
        this.generateCostBreakdown(preferredCountry, academicLevel),
        this.getRecommendedUniversities(preferredCountry, desiredCourse),
        this.getVisaInformation(preferredCountry),
        this.getCareerProspects(desiredCourse, preferredCountry),
        this.getScholarshipOpportunities(preferredCountry, desiredCourse)
      ]);

      // Create comprehensive pathway using static data
      const pathway = {
        id: pathwayId,
        country: preferredCountry,
        course: desiredCourse,
        academicLevel: academicLevel,
        createdAt: new Date().toISOString(),
        type: 'static',
        
        // All resolved values (no Promises)
        steps,
        timeline: this.generateTimeline(academicLevel),
        requirements,
        costs,
        universities,
        visa,
        career,
        scholarships,
        tips: this.generateCountrySpecificTips(preferredCountry),
        
        // Additional metadata
        generatedBy: 'Static Logic',
        lastUpdated: new Date().toISOString()
      };

      return pathway;
    } catch (error) {
      console.error('Error creating static pathway:', error);
      throw new Error('Failed to create static pathway');
    }
  }

  /**
   * Generate step-by-step pathway
   */
  async generatePathwaySteps(userProfile) {
    const { academicLevel, preferredCountry, englishProficiency } = userProfile;
    
    const baseSteps = [
      {
        step: 1,
        title: "Academic Preparation",
        description: "Improve academic credentials and GPA",
        duration: "6-12 months",
        tasks: [
          "Maintain/improve current GPA",
          "Complete prerequisite courses",
          "Build strong academic portfolio"
        ],
        status: "pending"
      },
      {
        step: 2,
        title: "Language Proficiency",
        description: "Achieve required English proficiency scores",
        duration: "3-6 months",
        tasks: this.getLanguageRequirements(preferredCountry, englishProficiency),
        status: "pending"
      },
      {
        step: 3,
        title: "Standardized Tests",
        description: "Prepare and take required standardized tests",
        duration: "3-6 months",
        tasks: this.getStandardizedTestRequirements(academicLevel, preferredCountry),
        status: "pending"
      },
      {
        step: 4,
        title: "University Research",
        description: "Research and shortlist universities",
        duration: "2-3 months",
        tasks: [
          "Research university rankings and programs",
          "Check admission requirements",
          "Shortlist 8-12 universities",
          "Contact admissions offices"
        ],
        status: "pending"
      },
      {
        step: 5,
        title: "Application Preparation",
        description: "Prepare application materials",
        duration: "3-4 months",
        tasks: [
          "Write statement of purpose",
          "Prepare resume/CV",
          "Collect recommendation letters",
          "Prepare portfolio (if required)"
        ],
        status: "pending"
      },
      {
        step: 6,
        title: "Financial Planning",
        description: "Arrange funding and financial documents",
        duration: "2-4 months",
        tasks: [
          "Apply for scholarships",
          "Arrange education loans",
          "Prepare financial documents",
          "Plan for living expenses"
        ],
        status: "pending"
      },
      {
        step: 7,
        title: "Application Submission",
        description: "Submit university applications",
        duration: "1-2 months",
        tasks: [
          "Complete online applications",
          "Submit required documents",
          "Pay application fees",
          "Track application status"
        ],
        status: "pending"
      },
      {
        step: 8,
        title: "Visa Preparation",
        description: "Prepare for student visa application",
        duration: "2-3 months",
        tasks: await this.getVisaPreparationTasks(preferredCountry),
        status: "pending"
      },
      {
        step: 9,
        title: "Pre-Departure",
        description: "Final preparations before departure",
        duration: "1-2 months",
        tasks: [
          "Book accommodation",
          "Arrange airport pickup",
          "Pack essentials",
          "Complete orientation programs"
        ],
        status: "pending"
      }
    ];

    return baseSteps;
  }

  /**
   * Generate language requirements based on country
   */
  getLanguageRequirements(country, currentProficiency) {
    const requirements = {
      'United States': ["Take TOEFL iBT (Target: 80-100)", "Alternative: IELTS (Target: 6.5-7.5)", "Consider Duolingo English Test"],
      'United Kingdom': ["Take IELTS Academic (Target: 6.5-7.5)", "Alternative: TOEFL iBT (Target: 90-100)", "Some universities accept PTE Academic"],
      'Canada': ["Take IELTS General/Academic (Target: 6.5-7.5)", "Alternative: TOEFL iBT (Target: 85-100)", "French proficiency for Quebec (TEF/TCF)"],
      'Australia': ["Take IELTS Academic (Target: 6.5-7.5)", "Alternative: TOEFL iBT (Target: 80-100)", "PTE Academic also accepted"],
      'Germany': ["IELTS/TOEFL for English-taught programs (Target: IELTS 6.5+ or TOEFL 90+)", "German proficiency (B2/C1) for German-taught programs", "TestDaF or DSH for German-medium programs (optional for English programs)"],
      'Netherlands': ["IELTS Academic (Target: 6.5-7.0)", "TOEFL iBT (Target: 80-100)", "Some programs require higher scores"]
    };

    return requirements[country] || ["Take IELTS Academic (Target: 6.5-7.0)", "Alternative: TOEFL iBT (Target: 80-90)"];
  }
  /**
   * Generate standardized test requirements (optimized for required vs optional)
   */
  getStandardizedTestRequirements(academicLevel, country) {
    const requirements = {
      required: [],
      optional: [],
      countrySpecific: []
    };

    if (academicLevel === 'undergraduate') {
      if (country === 'United States') {
        requirements.required = ["Take SAT (Target: 1400+) OR ACT (Target: 30+)"];
        requirements.optional = ["SAT Subject Tests (program-specific)", "AP Exams for credit"];
      } else if (country === 'United Kingdom') {
        requirements.required = ["A-Levels or equivalent"];
        requirements.optional = ["Additional entrance exams (university-specific)"];      } else if (country === 'Germany') {
        requirements.required = ["Recognized secondary education (for undergraduate only)"];
        requirements.optional = ["Studienkolleg preparation (for some international students)"];
      } else if (country === 'Netherlands') {
        requirements.required = ["Secondary education diploma equivalent"];
        requirements.optional = ["Program-specific tests"];
      } else {
        requirements.required = ["High school diploma equivalent"];
        requirements.optional = ["Country-specific entrance exams"];
      }
    } else if (academicLevel === 'graduate') {
      if (country === 'United States') {
        requirements.required = ["GRE General (Target: 310+) OR GMAT (for business)"];
        requirements.optional = ["GRE Subject Test (field-specific)", "Additional program requirements"];
      } else if (country === 'United Kingdom') {
        requirements.required = ["Bachelor's degree in relevant field"];
        requirements.optional = ["GRE/GMAT (for competitive programs)"];
      } else if (country === 'Germany') {
        requirements.required = ["Bachelor's degree recognized in Germany"];
        requirements.optional = ["GRE (for international programs)", "German language test"];
      } else if (country === 'Netherlands') {
        requirements.required = ["Bachelor's degree from recognized institution"];
        requirements.optional = ["GMAT/GRE (for business/research programs)"];
      } else {
        requirements.required = ["Relevant bachelor's degree"];
        requirements.optional = ["GRE/GMAT (program-dependent)"];
      }
    }

    // Combine into formatted array (prioritize required tests)
    const formattedRequirements = [
      ...requirements.required.map(test => `🔴 REQUIRED: ${test}`),
      ...requirements.optional.map(test => `⚪ OPTIONAL: ${test}`)
    ];

    return formattedRequirements.length > 0 ? formattedRequirements : ["Check specific program requirements"];
  }

  /**
   * Generate timeline based on academic level
   */
  generateTimeline(academicLevel) {
    const baseTimeline = {
      'undergraduate': {
        totalDuration: '18-24 months',
        phases: [
          { phase: 'Preparation', duration: '12-18 months', description: 'Academic prep, tests, research' },
          { phase: 'Application', duration: '3-6 months', description: 'Apply to universities' },
          { phase: 'Decision & Visa', duration: '3-4 months', description: 'Accept offers, visa process' }
        ]
      },
      'graduate': {
        totalDuration: '15-20 months',
        phases: [
          { phase: 'Preparation', duration: '9-12 months', description: 'Tests, research, networking' },
          { phase: 'Application', duration: '3-4 months', description: 'Apply to universities' },
          { phase: 'Decision & Visa', duration: '3-4 months', description: 'Accept offers, visa process' }
        ]
      },
      'phd': {
        totalDuration: '18-24 months',
        phases: [
          { phase: 'Research & Prep', duration: '12-15 months', description: 'Research areas, contact professors' },
          { phase: 'Application', duration: '3-6 months', description: 'Apply to programs' },
          { phase: 'Decision & Visa', duration: '3-4 months', description: 'Accept offers, visa process' }
        ]
      }
    };

    return baseTimeline[academicLevel] || baseTimeline['graduate'];
  }

  /**
   * Generate requirements based on country and course
   */
  async generateRequirements(country, course) {
    const requirements = {
      academic: this.getAcademicRequirements(country, course),
      documents: this.getDocumentRequirements(country),
      financial: this.getFinancialRequirements(country),
      language: this.getLanguageRequirements(country, 'intermediate')
    };

    return requirements;
  }

  /**
   * Get academic requirements
   */
  getAcademicRequirements(country, course) {
    const baseRequirements = {
      'United States': {
        gpa: 'Minimum 3.0/4.0 (varies by university)',
        grades: '85%+ in relevant subjects',
        additional: 'Strong extracurricular activities'
      },
      'United Kingdom': {
        gpa: 'First class or 2:1 honors degree equivalent',
        grades: 'AAB-A*A*A* for undergraduate',
        additional: 'Personal statement and references'
      },
      'Canada': {
        gpa: 'Minimum 3.0/4.0 or B grade',
        grades: '80%+ in last two years',
        additional: 'Work experience preferred'
      },
      'Australia': {
        gpa: 'Minimum 65% or credit average',
        grades: 'ATAR 80+ for undergraduate',
        additional: 'Relevant work experience'
      }
    };

    return baseRequirements[country] || baseRequirements['United States'];
  }

  /**
   * Get document requirements
   */
  getDocumentRequirements(country) {
    return [
      'Academic transcripts (official)',
      'Degree certificates',
      'Statement of Purpose/Personal Statement',
      'Letters of Recommendation (2-3)',
      'Resume/CV',
      'Passport copy',
      'Financial statements',
      'English proficiency scores',
      'Standardized test scores',
      'Portfolio (if applicable)'
    ];
  }

  /**
   * Get financial requirements
   */
  getFinancialRequirements(country) {
    const financialReqs = {
      'United States': {
        tuition: '$25,000 - $60,000 per year',
        living: '$15,000 - $25,000 per year',
        total: '$40,000 - $85,000 per year',
        proof: 'Bank statements for 1-2 years of expenses'
      },
      'United Kingdom': {
        tuition: '£15,000 - £35,000 per year',
        living: '£12,000 - £18,000 per year',
        total: '£27,000 - £53,000 per year',
        proof: 'Bank statements for 28 days before visa application'
      },
      'Canada': {
        tuition: 'CAD $20,000 - $40,000 per year',
        living: 'CAD $15,000 - $20,000 per year',
        total: 'CAD $35,000 - $60,000 per year',
        proof: 'Proof of funds for first year + CAD $10,000'
      },
      'Australia': {
        tuition: 'AUD $25,000 - $45,000 per year',
        living: 'AUD $20,000 - $25,000 per year',
        total: 'AUD $45,000 - $70,000 per year',
        proof: 'Evidence of sufficient funds'
      }
    };

    return financialReqs[country] || financialReqs['United States'];
  }

  /**
   * Get recommended universities based on country and course
   */
  async getRecommendedUniversities(country, course) {
    try {
      // Query existing universities from the database
      const universitiesRef = collection(db, 'universities');
      const q = query(
        universitiesRef,
        where('country', '==', country),
        orderBy('ranking'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const universities = [];
      
      querySnapshot.forEach((doc) => {
        universities.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // If no universities found, provide default recommendations
      if (universities.length === 0) {
        return this.getDefaultUniversityRecommendations(country, course);
      }

      return universities;
    } catch (error) {
      console.error('Error fetching universities:', error);
      return this.getDefaultUniversityRecommendations(country, course);
    }
  }

  /**
   * Get default university recommendations
   */  getDefaultUniversityRecommendations(country, course) {
    const recommendations = {
      'United States': [
        { name: 'MIT', ranking: 1, tuition: '$53,790', location: 'Cambridge, MA' },
        { name: 'Stanford University', ranking: 2, tuition: '$56,169', location: 'Stanford, CA' },
        { name: 'Harvard University', ranking: 3, tuition: '$54,002', location: 'Cambridge, MA' },
        { name: 'UC Berkeley', ranking: 4, tuition: '$44,007', location: 'Berkeley, CA' },
        { name: 'Carnegie Mellon', ranking: 5, tuition: '$58,924', location: 'Pittsburgh, PA' }
      ],
      'United Kingdom': [
        { name: 'University of Oxford', ranking: 1, tuition: '£28,370', location: 'Oxford' },
        { name: 'University of Cambridge', ranking: 2, tuition: '£22,227', location: 'Cambridge' },
        { name: 'Imperial College London', ranking: 3, tuition: '£33,750', location: 'London' },
        { name: 'London School of Economics', ranking: 4, tuition: '£22,430', location: 'London' },
        { name: 'University College London', ranking: 5, tuition: '£25,800', location: 'London' }
      ],
      'Canada': [
        { name: 'University of Toronto', ranking: 1, tuition: 'CAD $58,160', location: 'Toronto, ON' },
        { name: 'McGill University', ranking: 2, tuition: 'CAD $42,030', location: 'Montreal, QC' },
        { name: 'University of British Columbia', ranking: 3, tuition: 'CAD $40,945', location: 'Vancouver, BC' },
        { name: 'University of Waterloo', ranking: 4, tuition: 'CAD $48,000', location: 'Waterloo, ON' },
        { name: 'McMaster University', ranking: 5, tuition: 'CAD $27,965', location: 'Hamilton, ON' }
      ],
      'Germany': [
        { name: 'Technical University of Munich', ranking: 1, tuition: '€0 (Public)', location: 'Munich' },
        { name: 'Ludwig Maximilian University', ranking: 2, tuition: '€0 (Public)', location: 'Munich' },
        { name: 'Heidelberg University', ranking: 3, tuition: '€0 (Public)', location: 'Heidelberg' },
        { name: 'KIT (Karlsruhe Institute)', ranking: 4, tuition: '€0 (Public)', location: 'Karlsruhe' },
        { name: 'RWTH Aachen University', ranking: 5, tuition: '€0 (Public)', location: 'Aachen' }
      ],
      'Australia': [
        { name: 'Australian National University', ranking: 1, tuition: 'AUD $45,360', location: 'Canberra' },
        { name: 'University of Melbourne', ranking: 2, tuition: 'AUD $43,008', location: 'Melbourne' },
        { name: 'University of Sydney', ranking: 3, tuition: 'AUD $46,500', location: 'Sydney' },
        { name: 'University of Queensland', ranking: 4, tuition: 'AUD $41,280', location: 'Brisbane' },
        { name: 'UNSW Sydney', ranking: 5, tuition: 'AUD $45,180', location: 'Sydney' }
      ],
      'Netherlands': [
        { name: 'University of Amsterdam', ranking: 1, tuition: '€2,314 (EU) / €21,441 (Non-EU)', location: 'Amsterdam' },
        { name: 'Delft University of Technology', ranking: 2, tuition: '€2,314 (EU) / €19,326 (Non-EU)', location: 'Delft' },
        { name: 'Leiden University', ranking: 3, tuition: '€2,314 (EU) / €18,900 (Non-EU)', location: 'Leiden' },
        { name: 'Utrecht University', ranking: 4, tuition: '€2,314 (EU) / €20,350 (Non-EU)', location: 'Utrecht' },
        { name: 'Erasmus University Rotterdam', ranking: 5, tuition: '€2,314 (EU) / €16,500 (Non-EU)', location: 'Rotterdam' }
      ]
    };

    return recommendations[country] || recommendations['United States'];
  }

  /**
   * Generate cost breakdown
   */
  async generateCostBreakdown(country, academicLevel) {    const costData = {
      'United States': {
        tuition: { min: 25000, max: 60000, currency: 'USD' },
        living: { min: 15000, max: 25000, currency: 'USD' },
        miscellaneous: { min: 3000, max: 5000, currency: 'USD' }
      },
      'United Kingdom': {
        tuition: { min: 15000, max: 35000, currency: 'GBP' },
        living: { min: 12000, max: 18000, currency: 'GBP' },
        miscellaneous: { min: 2000, max: 4000, currency: 'GBP' }
      },
      'Canada': {
        tuition: { min: 20000, max: 40000, currency: 'CAD' },
        living: { min: 15000, max: 20000, currency: 'CAD' },
        miscellaneous: { min: 2500, max: 4000, currency: 'CAD' }
      },
      'Australia': {
        tuition: { min: 25000, max: 45000, currency: 'AUD' },
        living: { min: 20000, max: 25000, currency: 'AUD' },
        miscellaneous: { min: 3000, max: 5000, currency: 'AUD' }
      },
      'Germany': {
        tuition: { min: 0, max: 500, currency: 'EUR' },
        living: { min: 8000, max: 12000, currency: 'EUR' },
        miscellaneous: { min: 1500, max: 3000, currency: 'EUR' }
      },
      'Netherlands': {
        tuition: { min: 2314, max: 21441, currency: 'EUR' },
        living: { min: 9000, max: 14000, currency: 'EUR' },
        miscellaneous: { min: 2000, max: 3500, currency: 'EUR' }
      },
      'France': {
        tuition: { min: 170, max: 3770, currency: 'EUR' },
        living: { min: 9000, max: 15000, currency: 'EUR' },
        miscellaneous: { min: 2000, max: 3000, currency: 'EUR' }
      }
    };

    const countryData = costData[country] || costData['United States'];
    
    return {
      tuition: countryData.tuition,
      living: countryData.living,
      miscellaneous: countryData.miscellaneous,
      total: {
        min: countryData.tuition.min + countryData.living.min + countryData.miscellaneous.min,
        max: countryData.tuition.max + countryData.living.max + countryData.miscellaneous.max,
        currency: countryData.tuition.currency
      }
    };
  }

  /**
   * Get visa information
   */
  async getVisaInformation(country) {
    const visaInfo = {
      'United States': {
        type: 'F-1 Student Visa',
        processingTime: '2-4 weeks',
        fee: '$350',
        requirements: [
          'Form I-20 from university',
          'SEVIS fee payment ($350)',
          'DS-160 form completion',
          'Visa interview appointment',
          'Financial documents',
          'Academic records'
        ],
        workPermissions: 'On-campus work allowed, CPT/OPT for internships'
      },
      'United Kingdom': {
        type: 'Student Visa (Tier 4)',
        processingTime: '3-6 weeks',
        fee: '£348',
        requirements: [
          'CAS from university',
          'English proficiency proof',
          'Financial evidence',
          'Academic qualifications',
          'Tuberculosis test (if required)',
          'Immigration Health Surcharge'
        ],
        workPermissions: '20 hours/week during studies, full-time during breaks'
      },
      'Canada': {
        type: 'Study Permit',
        processingTime: '4-12 weeks',
        fee: 'CAD $150',
        requirements: [
          'Letter of acceptance',
          'Proof of funds',
          'Medical exam (if required)',
          'Police clearance',
          'Statement of purpose',
          'Biometrics'
        ],
        workPermissions: '20 hours/week during studies, full-time during breaks'
      },      'Australia': {
        type: 'Student Visa (Subclass 500)',
        processingTime: '4-6 weeks',
        fee: 'AUD $650',
        requirements: [
          'Confirmation of Enrolment (CoE)',
          'Genuine Temporary Entrant statement',
          'Financial capacity evidence',
          'English proficiency',
          'Health insurance (OSHC)',
          'Health examinations'
        ],
        workPermissions: '40 hours/fortnight during studies, unlimited during breaks'
      },
      'Germany': {
        type: 'National Visa (Type D) for Studies',
        processingTime: '4-8 weeks',
        fee: '€75',
        requirements: [
          'Letter of admission from German university',
          'Proof of financial resources (€11,208/year)',
          'Health insurance certificate',
          'Educational certificates (apostilled)',
          'German or English proficiency proof',
          'Motivation letter'
        ],
        workPermissions: '120 full days or 240 half days per year'
      },
      'Netherlands': {
        type: 'Study Visa/Residence Permit',
        processingTime: '2-4 weeks',
        fee: '€350',
        requirements: [
          'Letter of acceptance',
          'Proof of sufficient funds (€13,800/year)',
          'Health insurance',
          'Educational certificates',
          'English proficiency proof',
          'TB test (from certain countries)'
        ],
        workPermissions: '16 hours/week during studies, full-time during holidays'
      }
    };

    return visaInfo[country] || visaInfo['United States'];
  }

  /**
   * Get visa preparation tasks
   */
  async getVisaPreparationTasks(country) {
    const tasks = {
      'United States': [
        'Receive I-20 from university',
        'Pay SEVIS fee',
        'Complete DS-160 form',
        'Schedule visa interview',
        'Prepare financial documents',
        'Attend visa interview'
      ],
      'United Kingdom': [
        'Receive CAS from university',
        'Complete online application',
        'Pay immigration health surcharge',
        'Book biometrics appointment',
        'Prepare supporting documents',
        'Submit application'
      ],
      'Canada': [
        'Receive letter of acceptance',
        'Complete online application',
        'Pay fees and provide biometrics',
        'Submit required documents',
        'Complete medical exam (if required)',
        'Wait for processing'
      ],      'Australia': [
        'Receive CoE from university',
        'Purchase OSHC insurance',
        'Complete online application',
        'Submit health examinations',
        'Provide biometrics',
        'Submit application'
      ],
      'Germany': [
        'Receive admission letter from university',
        'Open blocked account (€11,208)',
        'Get health insurance certificate',
        'Apostille educational documents',
        'Complete visa application form',
        'Schedule appointment at German consulate',
        'Attend visa interview'
      ],
      'Netherlands': [
        'Receive letter of acceptance',
        'Arrange health insurance',
        'Prove sufficient funds',
        'Complete online application',
        'Submit biometrics',
        'Wait for processing'
      ]
    };

    return tasks[country] || tasks['United States'];
  }

  /**
   * Get career prospects
   */
  async getCareerProspects(course, country, targetCompany) {
    const prospects = {
      averageSalary: this.getAverageSalary(course, country),
      jobMarket: this.getJobMarket(course, country),
      topEmployers: this.getTopEmployers(course, country),
      careerPaths: this.getCareerPaths(course),
      postStudyWorkRights: this.getPostStudyWorkRights(country)
    };

    if (targetCompany) {
      prospects.targetCompanyInfo = await this.getTargetCompanyInfo(targetCompany, country);
    }

    return prospects;
  }

  /**
   * Get scholarship opportunities
   */
  async getScholarshipOpportunities(country, course) {
    const scholarships = {
      'United States': [
        { name: 'Fulbright Program', amount: 'Full funding', eligibility: 'International students' },
        { name: 'University Merit Scholarships', amount: '$10,000-$30,000', eligibility: 'High academic achievers' },
        { name: 'AAUW International Fellowships', amount: '$18,000-$30,000', eligibility: 'Women in STEM' }
      ],
      'United Kingdom': [
        { name: 'Chevening Scholarships', amount: 'Full funding', eligibility: 'Leadership potential' },
        { name: 'Commonwealth Scholarships', amount: 'Full funding', eligibility: 'Commonwealth citizens' },
        { name: 'University Scholarships', amount: '£5,000-£15,000', eligibility: 'Academic excellence' }
      ],      'Canada': [
        { name: 'Vanier Canada Graduate Scholarships', amount: 'CAD $50,000', eligibility: 'PhD students' },
        { name: 'Ontario Graduate Scholarship', amount: 'CAD $15,000', eligibility: 'Graduate students in Ontario' },
        { name: 'University Entrance Scholarships', amount: 'CAD $5,000-$20,000', eligibility: 'High school graduates' }
      ],
      'Germany': [
        { name: 'DAAD Scholarships', amount: '€850-€1,200/month', eligibility: 'International students' },
        { name: 'Heinrich Böll Foundation', amount: '€850/month + €300 allowance', eligibility: 'Outstanding academic performance' },
        { name: 'Konrad-Adenauer-Stiftung', amount: '€850/month', eligibility: 'Academic excellence and social engagement' },
        { name: 'Deutschlandstipendium', amount: '€300/month', eligibility: 'High achievers at German universities' }
      ],
      'Australia': [
        { name: 'Australia Awards', amount: 'Full funding', eligibility: 'Developing country citizens' },
        { name: 'Research Training Program', amount: 'Full tuition + living allowance', eligibility: 'Research students' },
        { name: 'University Merit Scholarships', amount: 'AUD $5,000-$20,000', eligibility: 'Academic excellence' }
      ],
      'Netherlands': [
        { name: 'Holland Scholarship', amount: '€5,000', eligibility: 'Non-EEA students' },
        { name: 'Orange Tulip Scholarship', amount: 'Varies', eligibility: 'Specific country students' },
        { name: 'University Excellence Scholarships', amount: '€3,000-€15,000', eligibility: 'High academic achievers' }
      ]
    };

    return scholarships[country] || scholarships['United States'];
  }

  /**
   * Generate country-specific tips
   */
  generateCountrySpecificTips(country) {
    const tips = {
      'United States': [
        'Start SAT/ACT preparation early',
        'Focus on extracurricular activities',
        'Apply to multiple universities (safety, match, reach)',
        'Consider community college transfer pathway',
        'Network with alumni and current students'
      ],
      'United Kingdom': [
        'Use UCAS for undergraduate applications',
        'Write a compelling personal statement',
        'Research university-specific requirements',
        'Consider foundation year if needed',
        'Apply for accommodation early'
      ],
      'Canada': [
        'Research provincial nominee programs',
        'Consider co-op programs for work experience',
        'Learn basic French for Quebec universities',
        'Apply for SIN number after arrival',
        'Join student associations for networking'
      ],      'Australia': [
        'Understand the academic calendar (February start)',
        'Research recognition of prior learning (RPL)',
        'Consider regional universities for easier visa',
        'Purchase Overseas Student Health Cover (OSHC)',
        'Join orientation programs for integration'
      ],
      'Germany': [
        'Learn basic German even for English programs',
        'Apply early - deadlines are strict (July 15 for winter semester)',
        'Get your documents apostilled and translated',
        'Open a blocked account for financial proof',
        'Research housing early - student accommodation is limited',
        'Consider Test AS for undergraduate admissions'
      ],
      'Netherlands': [
        'Apply before deadlines (May 1 for most programs)',
        'Learn basic Dutch for better integration',
        'Research housing through university or private providers',
        'Get health insurance from Dutch provider',
        'Consider cycling as primary transportation',
        'Join study associations for networking'
      ]
    };

    return tips[country] || tips['United States'];
  }

  /**
   * Personalize pathway for specific user
   */
  async personalizePathway(pathway, userProfile) {
    const personalizedPathway = { ...pathway };
    
    // Adjust timeline based on user's current status
    if (userProfile.currentGPA && userProfile.currentGPA < 3.0) {
      personalizedPathway.timeline.phases[0].duration = '15-20 months';
      personalizedPathway.timeline.totalDuration = '20-26 months';
    }

    // Add personalized recommendations
    personalizedPathway.personalizedRecommendations = [
      `Based on your GPA of ${userProfile.currentGPA}, focus on improving academic performance`,
      `Your ${userProfile.englishProficiency} English level suggests ${userProfile.englishProficiency === 'advanced' ? 'minimal' : 'intensive'} language preparation`,
      `Consider ${userProfile.workExperience ? 'highlighting' : 'gaining'} relevant work experience`
    ];

    // Adjust costs based on user budget
    if (userProfile.budget) {
      personalizedPathway.budgetAlignment = this.assessBudgetAlignment(
        personalizedPathway.costs.total,
        userProfile.budget
      );
    }

    personalizedPathway.userId = userProfile.userId;
    personalizedPathway.personalizedAt = new Date().toISOString();

    return personalizedPathway;
  }

  /**
   * Save pathway to Firestore
   */
  async savePathway(pathwayId, pathway) {
    try {
      await setDoc(doc(db, this.pathwaysCollection, pathwayId), pathway);
      return true;
    } catch (error) {
      console.error('Error saving pathway:', error);
      throw error;
    }
  }
  /**
   * Remove undefined fields and promises from an object to prevent Firestore errors
   */
  sanitizeDataForFirestore(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeDataForFirestore(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip undefined values, functions, and promises
        if (value !== undefined && typeof value !== 'function' && !(value instanceof Promise)) {
          const sanitizedValue = this.sanitizeDataForFirestore(value);
          if (sanitizedValue !== undefined) {
            sanitized[key] = sanitizedValue;
          }
        }
      }
      return sanitized;
    }
    
    // Return primitive values as-is (except undefined)
    return obj;
  }

  /**
   * Save user-specific pathway
   */
  async saveUserPathway(userId, pathway) {
    try {
      const userPathwayId = `${userId}_${pathway.id}`;
      
      // Sanitize the pathway data before saving
      const sanitizedPathway = this.sanitizeDataForFirestore({
        ...pathway,
        userId,
        createdAt: new Date().toISOString()
      });
      
      await setDoc(doc(db, this.userPathwaysCollection, userPathwayId), sanitizedPathway);
      return true;
    } catch (error) {
      console.error('Error saving user pathway:', error);
      throw new Error('Failed to save pathway');
    }
  }
  /**
   * Get user's saved pathways
   */
  async getUserPathways(userId) {
    try {
      const q = query(
        collection(db, this.userPathwaysCollection),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const pathways = [];
      
      querySnapshot.forEach((doc) => {
        pathways.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by createdAt in JavaScript instead of Firestore
      return pathways.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
    } catch (error) {
      console.error('Error fetching user pathways:', error);
      return [];
    }
  }  /**
   * Get user's existing pathway (most recent active pathway)
   */
  async getUserPathway(userId) {
    try {
      // First try to get active pathways
      const activePathwaysQuery = query(
        collection(db, this.userPathwaysCollection),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const activeSnapshot = await getDocs(activePathwaysQuery);
      
      if (!activeSnapshot.empty) {
        // Sort in JavaScript and get the most recent
        const activeDocs = activeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedActive = activeDocs.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        return sortedActive[0];
      }
      
      // Fallback to any pathway if no active ones
      const fallbackQuery = query(
        collection(db, this.userPathwaysCollection),
        where('userId', '==', userId)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      if (!fallbackSnapshot.empty) {
        // Sort in JavaScript and get the most recent
        const allDocs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedAll = allDocs.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        return sortedAll[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user pathway:', error);
      return null;
    }
  }  /**
   * Save or update user pathway with improved history management
   * Updates existing pathway for same country, creates new for different country
   */
  async saveUserPathway(userId, pathwayData) {
    try {
      // Validate required parameters
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!pathwayData || !pathwayData.country) {
        throw new Error('Pathway data with country is required');
      }

      // Check if user already has a pathway for this country
      const existingPathwayQuery = query(
        collection(db, this.userPathwaysCollection),
        where('userId', '==', userId),
        where('country', '==', pathwayData.country),
        where('isActive', '==', true)
      );
      
      const existingSnapshot = await getDocs(existingPathwayQuery);
        if (!existingSnapshot.empty) {
        // Update existing pathway for the same country
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data();
        
        const updatedPathway = {
          ...pathwayData,
          userId,
          createdAt: existingData.createdAt, // Keep original creation date
          updatedAt: new Date().toISOString(),
          pathwayType: 'user_generated',
          isActive: true,
          // Preserve step progress if it exists
          steps: this.mergeStepProgress(existingData.steps, pathwayData.steps)
        };

        // Filter out undefined values to prevent Firestore errors
        const cleanedPathway = this.removeUndefinedFields(updatedPathway);

        await updateDoc(existingDoc.ref, cleanedPathway);
        return existingDoc.id;
      } else {
        // Create new pathway for different country
        const userPathwayId = `${userId}_${pathwayData.country}_${pathwayData.course}_${Date.now()}`;
        const pathwayWithMeta = {
          ...pathwayData,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pathwayType: 'user_generated',
          isActive: true
        };

        // Filter out undefined values to prevent Firestore errors
        const cleanedPathway = this.removeUndefinedFields(pathwayWithMeta);

        await setDoc(doc(db, this.userPathwaysCollection, userPathwayId), cleanedPathway);
        return userPathwayId;
      }
    } catch (error) {
      console.error('Error saving user pathway:', error);
      throw new Error('Failed to save pathway');
    }
  }  /**
   * Update user pathway step status
   */
  async updateUserPathwayStep(userId, stepIndex, newStatus) {
    try {
      const userPathway = await this.getUserPathway(userId);
      if (!userPathway) {
        throw new Error('User pathway not found');
      }

      const updatedSteps = [...userPathway.steps];
      updatedSteps[stepIndex].status = newStatus;
      updatedSteps[stepIndex].updatedAt = new Date().toISOString();

      const updatedPathway = {
        ...userPathway,
        steps: updatedSteps,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, this.userPathwaysCollection, userPathway.id), {
        steps: updatedSteps,
        updatedAt: new Date().toISOString()
      });

      return updatedPathway;
    } catch (error) {
      console.error('Error updating pathway step:', error);
      throw new Error('Failed to update step status');
    }
  }
  /**
   * Generate pathway from academic profile data
   */
  async generatePathwayFromProfile(academicProfile, userId) {
    try {
      // Transform academic profile to pathway format
      const pathwayData = {
        userId,
        preferredCountry: academicProfile.preferred_countries?.[0] || 'USA',
        desiredCourse: academicProfile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: academicProfile.education_level || 'Bachelor',
        budget: {
          min: academicProfile.budget_min || 0,
          max: academicProfile.budget_max || 100000
        },
        currentGPA: academicProfile.cgpa || 0,
        englishProficiency: {
          ielts: academicProfile.ielts_score || 0,
          toefl: academicProfile.toefl_score || 0
        },
        standardizedTests: {
          gre: academicProfile.gre_score || 0
        },
        timeline: {
          targetIntake: academicProfile.target_intake,
          targetYear: academicProfile.target_year
        },
        nationality: academicProfile.nationality,
        fullName: academicProfile.full_name
      };

      return await this.generatePathway(pathwayData);
    } catch (error) {
      console.error('Error generating pathway from profile:', error);
      throw new Error('Failed to generate pathway from profile');
    }
  }

  /**
   * Update pathways when user profile changes (automatic sync)
   */
  async updatePathwaysOnProfileChange(userId, updatedProfile) {
    try {
      // Get user's current active pathways
      const currentPathways = await this.getUserPathways(userId);
      
      // Check if primary country preference changed
      const newPrimaryCountry = updatedProfile.preferred_countries?.[0];
      const shouldRegeneratePathway = currentPathways.some(pathway => 
        pathway.isActive && pathway.country !== newPrimaryCountry
      );
      
      if (shouldRegeneratePathway && newPrimaryCountry) {
        // Generate new pathway with updated profile
        const newPathway = await this.generatePathwayFromProfile(updatedProfile, userId);
        
        return {
          success: true,
          message: 'Pathway updated to reflect your new country preference',
          pathway: newPathway
        };
      }
      
      return {
        success: true,
        message: 'Profile updated - no pathway changes needed',
        pathway: null
      };
    } catch (error) {
      console.error('Error updating pathways on profile change:', error);
      return {
        success: false,
        message: 'Failed to update pathways',
        pathway: null
      };
    }
  }
  /**
   * Admin: Get all pathways
   */
  async getAllPathways() {
    try {
      const q = query(collection(db, this.pathwaysCollection));
      
      const querySnapshot = await getDocs(q);
      const pathways = [];
      
      querySnapshot.forEach((doc) => {
        pathways.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by createdAt in JavaScript
      return pathways.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching all pathways:', error);
      return [];
    }
  }

  /**
   * Admin: Delete pathway
   */
  async deletePathway(pathwayId) {
    try {
      await deleteDoc(doc(db, this.pathwaysCollection, pathwayId));
      return true;
    } catch (error) {
      console.error('Error deleting pathway:', error);
      throw error;
    }
  }

  /**
   * Admin: Update user pathway
   */
  async updateUserPathwayByAdmin(pathwayId, updates) {
    try {
      // Validate required parameters
      if (!pathwayId) {
        throw new Error('Pathway ID is required');
      }
      if (!updates) {
        throw new Error('Update data is required');
      }

      // Add update metadata
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'admin'
      };

      await updateDoc(doc(db, this.userPathwaysCollection, pathwayId), updateData);
      return true;
    } catch (error) {
      console.error('Error updating user pathway by admin:', error);
      throw new Error('Failed to update pathway');
    }
  }

  /**
   * Admin: Create pathway template
   */
  async createPathwayTemplate(templateData) {
    try {
      // Validate required parameters
      if (!templateData || !templateData.country || !templateData.course) {
        throw new Error('Template data with country and course is required');
      }

      const templateId = this.generatePathwayId(
        templateData.country, 
        templateData.course, 
        templateData.academicLevel || 'graduate'
      );

      const template = {
        ...templateData,
        id: templateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'template',
        createdBy: 'admin'
      };

      await setDoc(doc(db, this.pathwaysCollection, templateId), template);
      return templateId;
    } catch (error) {
      console.error('Error creating pathway template:', error);
      throw new Error('Failed to create pathway template');
    }
  }

  /**
   * Admin: Update pathway template
   */
  async updatePathwayTemplate(templateId, updates) {
    try {
      if (!templateId) {
        throw new Error('Template ID is required');
      }
      if (!updates) {
        throw new Error('Update data is required');
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'admin'
      };

      await updateDoc(doc(db, this.pathwaysCollection, templateId), updateData);
      return true;
    } catch (error) {
      console.error('Error updating pathway template:', error);
      throw new Error('Failed to update pathway template');
    }
  }

  /**
   * Admin: Get pathway statistics
   */
  async getPathwayStatistics() {
    try {
      const [pathways, userPathways] = await Promise.all([
        this.getAllPathways(),
        this.getAllUserPathways()
      ]);

      const stats = {
        totalTemplates: pathways.length,
        totalUserPathways: userPathways.length,
        activeUserPathways: userPathways.filter(p => p.isActive).length,
        countryDistribution: {},
        courseDistribution: {},
        completionRates: []
      };

      // Calculate distributions
      userPathways.forEach(pathway => {
        if (pathway.country) {
          stats.countryDistribution[pathway.country] = 
            (stats.countryDistribution[pathway.country] || 0) + 1;
        }
        if (pathway.course) {
          stats.courseDistribution[pathway.course] = 
            (stats.courseDistribution[pathway.course] || 0) + 1;
        }

        // Calculate completion rate for this pathway
        if (pathway.steps && pathway.steps.length > 0) {
          const completedSteps = pathway.steps.filter(s => s.status === 'completed').length;
          const completionRate = (completedSteps / pathway.steps.length) * 100;
          stats.completionRates.push(completionRate);
        }
      });

      // Calculate average completion rate
      stats.averageCompletionRate = stats.completionRates.length > 0
        ? stats.completionRates.reduce((a, b) => a + b, 0) / stats.completionRates.length
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting pathway statistics:', error);
      throw new Error('Failed to get pathway statistics');
    }
  }

  /**
   * Get average salary for course and country
   */
  getAverageSalary(course, country) {
    const salaryData = {
      'United States': {
        'Computer Science': '$95,000 - $150,000',
        'Data Science': '$90,000 - $140,000',
        'Business Administration': '$70,000 - $120,000',
        'Engineering': '$80,000 - $130,000',
        'default': '$65,000 - $100,000'
      },
      'United Kingdom': {
        'Computer Science': '£35,000 - £65,000',
        'Data Science': '£32,000 - £60,000',
        'Business Administration': '£28,000 - £50,000',
        'Engineering': '£30,000 - £55,000',
        'default': '£25,000 - £45,000'
      },
      'Canada': {
        'Computer Science': 'CAD $65,000 - $95,000',
        'Data Science': 'CAD $60,000 - $90,000',
        'Business Administration': 'CAD $50,000 - $75,000',
        'Engineering': 'CAD $55,000 - $85,000',
        'default': 'CAD $45,000 - $70,000'
      },
      'default': {
        'Computer Science': '$50,000 - $80,000',
        'Data Science': '$45,000 - $75,000',
        'Business Administration': '$40,000 - $65,000',
        'Engineering': '$42,000 - $70,000',
        'default': '$35,000 - $60,000'
      }
    };

    const countryData = salaryData[country] || salaryData['default'];
    return countryData[course] || countryData['default'];
  }

  /**
   * Get job market information
   */
  getJobMarket(course, country) {
    return {
      demand: 'High',
      growth: '10-15% annually',
      competitiveness: 'Moderate to High',
      keySkills: ['Technical expertise', 'Communication', 'Problem-solving']
    };
  }

  /**
   * Get top employers for course and country
   */
  getTopEmployers(course, country) {
    const employers = {
      'United States': {
        'Computer Science': ['Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook'],
        'Data Science': ['Google', 'Netflix', 'Uber', 'Airbnb', 'Tesla'],
        'Business Administration': ['McKinsey', 'Goldman Sachs', 'JP Morgan', 'Deloitte', 'PwC'],
        'default': ['Fortune 500 companies', 'Startups', 'Government agencies']
      },
      'United Kingdom': {
        'Computer Science': ['DeepMind', 'ARM', 'BAE Systems', 'Rolls-Royce', 'BT'],
        'Data Science': ['DeepMind', 'Babylon Health', 'Monzo', 'Revolut', 'BBC'],
        'Business Administration': ['HSBC', 'Barclays', 'Unilever', 'BP', 'Vodafone'],
        'default': ['FTSE 100 companies', 'Tech startups', 'Financial services']
      },
      'default': {
        'Computer Science': ['Tech companies', 'Consulting firms', 'Financial institutions'],
        'Data Science': ['Tech companies', 'Healthcare', 'Finance', 'E-commerce'],
        'Business Administration': ['Consulting', 'Banking', 'Healthcare', 'Retail'],
        'default': ['Various industries', 'Multinational corporations', 'Local companies']
      }
    };

    const countryData = employers[country] || employers['default'];
    return countryData[course] || countryData['default'];
  }

  /**
   * Get career paths for course
   */
  getCareerPaths(course) {
    const paths = {
      'Computer Science': [
        'Software Engineer',
        'Data Scientist',
        'Product Manager',
        'Tech Lead',
        'Solutions Architect'
      ],
      'Data Science': [
        'Data Scientist',
        'Machine Learning Engineer',
        'Data Analyst',
        'Research Scientist',
        'AI Engineer'
      ],
      'Business Administration': [
        'Management Consultant',
        'Business Analyst',
        'Project Manager',
        'Operations Manager',
        'Strategy Manager'
      ],
      'default': [
        'Entry-level positions',
        'Specialist roles',
        'Management positions',
        'Consulting opportunities',
        'Entrepreneurship'
      ]
    };

    return paths[course] || paths['default'];
  }

  /**
   * Get post-study work rights
   */
  getPostStudyWorkRights(country) {
    const workRights = {
      'United States': {
        duration: '1-3 years (OPT/STEM OPT)',
        requirements: 'Valid F-1 status, employment in field of study',
        pathway: 'Can lead to H-1B visa application'
      },
      'United Kingdom': {
        duration: '2 years (Graduate visa)',
        requirements: 'Completed degree from UK institution',
        pathway: 'Can switch to Skilled Worker visa'
      },
      'Canada': {
        duration: '1-3 years (PGWP)',
        requirements: 'Completed program at eligible institution',
        pathway: 'Can lead to permanent residence'
      },
      'Australia': {
        duration: '2-4 years (PSW visa)',
        requirements: 'Completed 2+ year degree',
        pathway: 'Points-based permanent residence pathway'
      },
      'Germany': {
        duration: '18 months (job search visa)',
        requirements: 'Completed German degree',
        pathway: 'Can lead to EU Blue Card'
      },
      'default': {
        duration: 'Varies by country',
        requirements: 'Check specific country requirements',
        pathway: 'Country-specific immigration pathways'
      }
    };

    return workRights[country] || workRights['default'];
  }

  /**
   * Get target company information (placeholder)
   */
  async getTargetCompanyInfo(targetCompany, country) {
    return {
      name: targetCompany,
      presence: `Has operations in ${country}`,
      opportunities: 'Various entry-level and experienced positions',
      requirements: 'Relevant degree and skills'
    };
  }

  /**
   * Merge step progress from existing pathway with new pathway steps
   * Preserves user's completed/in-progress status while updating step content
   */
  mergeStepProgress(existingSteps, newSteps) {
    if (!existingSteps || !Array.isArray(existingSteps)) {
      return newSteps;
    }
    
    if (!newSteps || !Array.isArray(newSteps)) {
      return existingSteps;
    }

    // Create a map of existing step progress by step number
    const existingProgress = {};
    existingSteps.forEach(step => {
      if (step.step) {
        existingProgress[step.step] = {
          status: step.status,
          completedAt: step.completedAt,
          notes: step.notes
        };
      }
    });

    // Merge progress with new steps
    return newSteps.map(newStep => {
      const existingStepProgress = existingProgress[newStep.step];
      if (existingStepProgress) {
        return {
          ...newStep,
          status: existingStepProgress.status,
          completedAt: existingStepProgress.completedAt,
          notes: existingStepProgress.notes
        };
      }
      return newStep;
    });
  }

  /**
   * Remove undefined fields from an object to prevent Firestore errors
   */
  removeUndefinedFields(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedFields(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
  /**
   * Check for pathway template updates and refresh user pathway if needed
   */
  async checkAndRefreshPathway(userId, currentPathway) {
    try {
      if (!currentPathway || !currentPathway.country || !currentPathway.course) {
        return { 
          success: false, 
          needsUpdate: false, 
          reason: 'Invalid pathway data',
          pathway: currentPathway
        };
      }

      // Get the latest pathway template for this country/course combination
      const templateId = this.generatePathwayId(
        currentPathway.country, 
        currentPathway.course, 
        currentPathway.academicLevel || 'graduate'
      );
      
      const latestTemplate = await this.getExistingPathway(templateId);
      
      if (!latestTemplate) {
        return { 
          success: false, 
          needsUpdate: false, 
          reason: 'No template found',
          pathway: currentPathway
        };
      }

      // Check if template was updated after user's pathway
      const userPathwayDate = new Date(currentPathway.updatedAt || currentPathway.createdAt);
      const templateDate = new Date(latestTemplate.updatedAt || latestTemplate.createdAt);
      
      if (templateDate > userPathwayDate) {
        // Refresh the pathway with latest template
        const refreshResult = await this.refreshPathwayFromTemplate(userId, currentPathway, latestTemplate);
        return {
          success: true,
          needsUpdate: true,
          reason: 'Admin updated pathway template',
          pathway: refreshResult.pathway
        };
      }

      return { 
        success: false, 
        needsUpdate: false, 
        reason: 'Pathway is up to date',
        pathway: currentPathway
      };
    } catch (error) {
      console.error('Error checking pathway updates:', error);
      return { 
        success: false, 
        needsUpdate: false, 
        reason: 'Error checking updates',
        pathway: currentPathway
      };
    }
  }

  /**
   * Refresh pathway with latest template data while preserving user progress
   */
  async refreshPathwayFromTemplate(userId, userPathway, latestTemplate) {
    try {
      // Merge latest template with user's current progress
      const refreshedPathway = {
        ...latestTemplate,
        // Preserve user-specific data
        userId: userPathway.userId,
        createdAt: userPathway.createdAt,
        updatedAt: new Date().toISOString(),
        pathwayType: 'user_generated',
        isActive: true,
        lastRefreshedAt: new Date().toISOString(),
        // Preserve step progress
        steps: this.mergeStepProgress(userPathway.steps, latestTemplate.steps)
      };

      // Save the refreshed pathway
      await this.saveUserPathway(userId, refreshedPathway);
      
      return {
        success: true,
        message: 'Pathway updated with latest information from admin',
        pathway: refreshedPathway
      };
    } catch (error) {
      console.error('Error refreshing pathway:', error);
      return {
        success: false,
        message: 'Failed to refresh pathway',
        pathway: null
      };
    }
  }
  /**
   * Enhanced pathway generation with automatic refresh logic
   */
  async generatePathwayWithRefresh(userProfile, forceRefresh = false) {
    try {
      const { userId, preferredCountry, desiredCourse, academicLevel } = userProfile;

      // Get current user pathway
      const currentPathway = await this.getUserPathway(userId);
      
      // Check if country or course changed (requires new pathway)
      const countryChanged = currentPathway && currentPathway.country !== preferredCountry;
      const courseChanged = currentPathway && currentPathway.course !== desiredCourse;
      
      if (countryChanged || courseChanged || !currentPathway) {
        // Generate completely new pathway
        const newPathway = await this.generatePathway(userProfile);
        return {
          success: true,
          message: 'New pathway generated successfully',
          pathway: newPathway
        };
      }

      // Check for template updates if not forcing refresh
      if (!forceRefresh) {
        const updateCheck = await this.checkAndRefreshPathway(userId, currentPathway);
        
        if (updateCheck.success && updateCheck.needsUpdate) {
          return {
            success: true,
            message: 'Pathway refreshed with latest updates',
            pathway: updateCheck.pathway
          };
        }
        
        // No updates needed, return current pathway
        return {
          success: true,
          message: 'Your pathway is already up to date',
          pathway: currentPathway
        };
      }

      // Force refresh requested
      const templateId = this.generatePathwayId(preferredCountry, desiredCourse, academicLevel);
      const latestTemplate = await this.getExistingPathway(templateId);
      
      if (latestTemplate) {
        const refreshResult = await this.refreshPathwayFromTemplate(userId, currentPathway, latestTemplate);
        return {
          success: true,
          message: 'Pathway force refreshed',
          pathway: refreshResult.pathway
        };
      } else {
        // No template exists, generate new pathway
        const newPathway = await this.generatePathway(userProfile);
        return {
          success: true,
          message: 'New pathway generated (no template found)',
          pathway: newPathway
        };
      }
      
    } catch (error) {
      console.error('Error in generatePathwayWithRefresh:', error);
      throw new Error('Failed to generate or refresh pathway');
    }
  }

  /**
   * Admin: Get all user pathways
   */
  async getAllUserPathways() {
    try {
      const q = query(collection(db, this.userPathwaysCollection));
      const querySnapshot = await getDocs(q);
      const userPathways = [];
      
      querySnapshot.forEach((doc) => {
        userPathways.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by creation date (newest first)
      return userPathways.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error fetching all user pathways:', error);
      return [];
    }
  }

  /**
   * Admin: Update user pathway step status
   */
  async updateUserPathwayStepByAdmin(pathwayId, stepIndex, newStatus, adminNotes = '') {
    try {
      if (!pathwayId || stepIndex === undefined || !newStatus) {
        throw new Error('Pathway ID, step index, and status are required');
      }

      const pathwayRef = doc(db, this.userPathwaysCollection, pathwayId);
      const pathwayDoc = await getDoc(pathwayRef);
      
      if (!pathwayDoc.exists()) {
        throw new Error('Pathway not found');
      }

      const pathwayData = pathwayDoc.data();
      const updatedSteps = [...pathwayData.steps];
      
      if (stepIndex >= updatedSteps.length) {
        throw new Error('Invalid step index');
      }

      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status: newStatus,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'admin',
        adminNotes: adminNotes || updatedSteps[stepIndex].adminNotes || ''
      };

      if (newStatus === 'completed') {
        updatedSteps[stepIndex].completedAt = new Date().toISOString();
      }

      await updateDoc(pathwayRef, {
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'admin'
      });

      return true;
    } catch (error) {
      console.error('Error updating pathway step by admin:', error);
      throw new Error('Failed to update step status');
    }
  }

  /**
   * Admin: Get user pathway progress summary
   */
  async getUserProgressSummary(userId) {
    try {
      const userPathways = await this.getUserPathways(userId);
      
      return userPathways.map(pathway => {
        const totalSteps = pathway.steps?.length || 0;
        const completedSteps = pathway.steps?.filter(s => s.status === 'completed').length || 0;
        const inProgressSteps = pathway.steps?.filter(s => s.status === 'in-progress').length || 0;
        const pendingSteps = pathway.steps?.filter(s => s.status === 'pending').length || 0;
        
        return {
          pathwayId: pathway.id,
          country: pathway.country,
          course: pathway.course,
          academicLevel: pathway.academicLevel,
          totalSteps,
          completedSteps,
          inProgressSteps,
          pendingSteps,
          completionPercentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
          createdAt: pathway.createdAt,
          updatedAt: pathway.updatedAt,
          isActive: pathway.isActive
        };
      });
    } catch (error) {
      console.error('Error getting user progress summary:', error);
      throw new Error('Failed to get user progress summary');
    }
  }

  /**
   * Admin: Search pathways by criteria
   */
  async searchPathways(searchCriteria) {
    try {
      const { country, course, academicLevel, type = 'template' } = searchCriteria;
      
      let q = query(collection(db, type === 'template' ? this.pathwaysCollection : this.userPathwaysCollection));
      
      if (country) {
        q = query(q, where('country', '==', country));
      }
      if (course) {
        q = query(q, where('course', '==', course));
      }
      if (academicLevel) {
        q = query(q, where('academicLevel', '==', academicLevel));
      }

      const querySnapshot = await getDocs(q);
      const pathways = [];
      
      querySnapshot.forEach((doc) => {
        pathways.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return pathways;
    } catch (error) {
      console.error('Error searching pathways:', error);
      return [];
    }
  }

  /**
   * Admin: Bulk update pathway templates
   */
  async bulkUpdateTemplates(updates) {
    try {
      const batch = [];
      
      for (const update of updates) {
        const { templateId, data } = update;
        const updateData = {
          ...data,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: 'admin'
        };
        
        batch.push(
          updateDoc(doc(db, this.pathwaysCollection, templateId), updateData)
        );
      }      await Promise.all(batch);
      return true;
    } catch (error) {
      console.error('Error bulk updating templates:', error);
      throw new Error('Failed to bulk update templates');
    }
  }

  /**
   * Create a basic fallback pathway when normal generation fails
   * This provides a minimal but functional pathway structure
   */
  async createBasicFallbackPathway(userProfile) {
    try {
      const {
        preferredCountry = 'United States',
        desiredCourse = 'Computer Science',
        academicLevel = 'graduate',
        userId
      } = userProfile;

      console.log('Creating basic fallback pathway for:', { preferredCountry, desiredCourse, academicLevel });

      // Generate a simple pathway ID
      const pathwayId = this.generatePathwayId(preferredCountry, desiredCourse, academicLevel);

      // Create basic steps that don't rely on external data
      const basicSteps = [
        {
          step: 1,
          title: "Academic Preparation",
          description: "Prepare your academic credentials",
          duration: "6-12 months",
          tasks: [
            "Maintain/improve your GPA",
            "Complete required prerequisite courses",
            "Gather academic transcripts"
          ],
          status: "pending"
        },
        {
          step: 2,
          title: "Language Proficiency",
          description: "Meet English language requirements",
          duration: "3-6 months",
          tasks: [
            "Take IELTS or TOEFL test",
            "Achieve required minimum scores",
            "Consider language preparation courses if needed"
          ],
          status: "pending"
        },
        {
          step: 3,
          title: "Standardized Tests",
          description: "Complete required standardized tests",
          duration: "3-6 months",
          tasks: [
            academicLevel === 'graduate' ? "Take GRE/GMAT if required" : "Complete SAT/ACT if required",
            "Prepare thoroughly for the exam",
            "Schedule test dates well in advance"
          ],
          status: "pending"
        },
        {
          step: 4,
          title: "University Research",
          description: "Research and select universities",
          duration: "2-3 months",
          tasks: [
            "Research universities in " + preferredCountry,
            "Check admission requirements for " + desiredCourse,
            "Create a list of target universities",
            "Contact admissions offices"
          ],
          status: "pending"
        },
        {
          step: 5,
          title: "Application Preparation",
          description: "Prepare application materials",
          duration: "3-4 months",
          tasks: [
            "Write statement of purpose",
            "Prepare resume/CV",
            "Collect recommendation letters",
            "Prepare portfolio if required"
          ],
          status: "pending"
        },
        {
          step: 6,
          title: "Application Submission",
          description: "Submit university applications",
          duration: "1-2 months",
          tasks: [
            "Complete online applications",
            "Submit all required documents",
            "Pay application fees",
            "Track application status"
          ],
          status: "pending"
        },
        {
          step: 7,
          title: "Financial Planning",
          description: "Arrange funding and financial documents",
          duration: "2-4 months",
          tasks: [
            "Research scholarship opportunities",
            "Apply for education loans if needed",
            "Prepare financial documentation",
            "Plan for living expenses"
          ],
          status: "pending"
        },
        {
          step: 8,
          title: "Visa Application",
          description: "Apply for student visa",
          duration: "2-3 months",
          tasks: [
            "Gather required visa documents",
            "Schedule visa interview",
            "Prepare for visa interview",
            "Submit visa application"
          ],
          status: "pending"
        },
        {
          step: 9,
          title: "Pre-Departure",
          description: "Final preparations before departure",
          duration: "1-2 months",
          tasks: [
            "Book accommodation",
            "Arrange airport pickup",
            "Pack essentials for study abroad",
            "Complete orientation programs"
          ],
          status: "pending"
        }
      ];

      // Create basic pathway object
      const basicPathway = {
        id: pathwayId,
        country: preferredCountry,
        course: desiredCourse,
        academicLevel: academicLevel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'basic_fallback',
        generatedBy: 'Fallback Logic',
        
        steps: basicSteps,
        
        // Basic timeline
        timeline: {
          totalDuration: "18-24 months",
          phases: [
            { phase: "Preparation", duration: "12-18 months", description: "Academic and test preparation" },
            { phase: "Application", duration: "6-8 months", description: "University applications and admissions" },
            { phase: "Pre-departure", duration: "2-3 months", description: "Visa and travel arrangements" }
          ]
        },

        // Basic cost information
        costs: {
          total: academicLevel === 'graduate' ? 50000 : 40000,
          breakdown: {
            tuition: academicLevel === 'graduate' ? 35000 : 28000,
            living: 12000,
            other: 3000
          },
          currency: 'USD'
        },

        // Basic requirements
        requirements: {
          academic: {
            gpa: academicLevel === 'graduate' ? 3.0 : 2.5,
            degree: academicLevel === 'graduate' ? "Bachelor's degree" : "High school diploma"
          },
          language: {
            ielts: 6.5,
            toefl: 90
          },
          standardizedTests: academicLevel === 'graduate' ? ["GRE"] : ["SAT"],
          documents: [
            "Academic transcripts",
            "Statement of purpose",
            "Recommendation letters",
            "Passport",
            "Financial documents"
          ]
        },

        // Basic visa information
        visa: {
          type: "Student Visa",
          processingTime: "2-8 weeks",
          requirements: [
            "Valid passport",
            "University acceptance letter",
            "Financial proof",
            "Visa application form"
          ]
        },

        // Basic tips
        tips: [
          "Start your preparation at least 18 months before intended start date",
          "Research multiple universities to increase your chances",
          "Keep all documents organized and make copies",
          "Budget for unexpected expenses",
          "Connect with current students or alumni for insights"
        ],

        // Metadata
        isFallback: true,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Basic fallback pathway created successfully');
      return basicPathway;

    } catch (error) {
      console.error('Error creating basic fallback pathway:', error);
      throw new Error('Failed to create even basic fallback pathway');
    }
  }

  /**
   * Save selected pathway from UniGuidePro for detailed analysis
   * @param {string} userId - User ID
   * @param {Object} pathway - Selected pathway from UniGuidePro
   */
  async saveSelectedPathway(userId, pathway) {
    try {
      const selectedPathwayRef = doc(db, 'selectedPathways', userId);
      await setDoc(selectedPathwayRef, {
        pathway: pathway,
        selectedAt: new Date().toISOString(),
        processed: false
      });
      console.log('✅ Selected pathway saved for detailed analysis');
    } catch (error) {
      console.error('Error saving selected pathway:', error);
      throw error;
    }
  }
  /**
   * Get selected pathway from UniGuidePro
   * @param {string} userId - User ID
   * @returns {Object|null} - Selected pathway or null
   */
  async getSelectedPathway(userId) {
    try {
      const selectedPathwayRef = doc(db, 'selectedPathways', userId);
      const docSnap = await getDoc(selectedPathwayRef);
      
      if (docSnap.exists() && !docSnap.data().processed) {
        return docSnap.data().pathway;
      }
      return null;
    } catch (error) {
      // Enhanced error handling for Firebase permissions
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        console.log('📋 No access to selected pathways collection (expected for most users) - returning null');
        return null;
      } else {
        console.error('Error getting selected pathway:', error);
        return null;
      }
    }
  }

  /**
   * Clear selected pathway flag after processing
   * @param {string} userId - User ID
   */
  async clearSelectedPathway(userId) {
    try {
      const selectedPathwayRef = doc(db, 'selectedPathways', userId);
      await updateDoc(selectedPathwayRef, {
        processed: true,
        processedAt: new Date().toISOString()
      });
      console.log('✅ Selected pathway cleared');
    } catch (error) {
      console.error('Error clearing selected pathway:', error);
    }
  }

  /**
   * Generate detailed pathway analysis using Gemini AI
   * @param {Object} detailedRequest - Comprehensive user data and requirements
   * @returns {Object} - Detailed AI-powered pathway
   */
  async generateDetailedPathwayWithAI(detailedRequest) {
    try {
      console.log('🤖 Calling Gemini AI for detailed pathway analysis');
      
      // Import AI service
      const aiRecommendationService = (await import('./aiRecommendationService.js')).default;
      
      // Prepare prompt for Gemini AI
      const prompt = this.buildDetailedAnalysisPrompt(detailedRequest);
      
      // Get AI response
      const aiResponse = await aiRecommendationService.getDetailedPathwayAnalysis(prompt);
      
      if (aiResponse && aiResponse.success) {
        // Save the detailed pathway
        await this.saveUserPathway(detailedRequest.userId, aiResponse.pathway);
        
        return {
          success: true,
          pathway: aiResponse.pathway
        };
      } else {
        throw new Error('AI analysis failed');
      }
    } catch (error) {
      console.error('Error generating detailed AI pathway:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive prompt for Gemini AI detailed analysis
   * @param {Object} request - Detailed request with user profile and selected pathway
   * @returns {string} - Formatted prompt for AI
   */
  buildDetailedAnalysisPrompt(request) {
    const { userProfile, selectedPathway, requirements } = request;
    
    return `
You are an expert study abroad consultant. Based on the following information, create a comprehensive, detailed study abroad pathway analysis.

USER PROFILE:
- Name: ${userProfile.fullName}
- Nationality: ${userProfile.nationality}
- Education Level: ${userProfile.educationLevel}
- Target Countries: ${userProfile.preferredCountries?.join(', ')}
- Field of Study: ${userProfile.preferredFields?.join(', ')}
- Target Intake: ${userProfile.targetIntake} ${userProfile.targetYear}
- Budget Range: $${userProfile.budgetMin} - $${userProfile.budgetMax}
- Academic Performance: CGPA ${userProfile.cgpa}
- English Proficiency: IELTS ${userProfile.ieltsScore}, TOEFL ${userProfile.toeflScore}
- GRE Score: ${userProfile.greScore}
- Work Experience: ${userProfile.workExperience}
- Research Experience: ${userProfile.researchExperience}
- Extracurriculars: ${userProfile.extracurriculars}

SELECTED PATHWAY FROM UNIGUIDEPRO:
${JSON.stringify(selectedPathway, null, 2)}

REQUIRED ANALYSIS:
Please provide a detailed analysis covering:
1. University recommendations based on user's academic profile and scores
2. Exact document checklist with specific deadlines
3. Detailed cost breakdown by city/region
4. Living expenses and accommodation options
5. Visa requirements and application timeline
6. Scholarship opportunities matching the user's profile
7. Step-by-step application timeline (month by month)
8. Country-specific requirements and procedures
9. Backup options and alternatives

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "id": "detailed_pathway_analysis",
  "country": "target country",
  "course": "field of study",
  "academicLevel": "education level",
  "timeline": {
    "totalDuration": "X months",
    "phases": [...]
  },
  "universities": [
    {
      "name": "University Name",
      "ranking": "QS ranking",
      "tuition": "exact fees",
      "location": "city, country",
      "requirements": {
        "gpa": "minimum required",
        "ielts": "minimum score",
        "documents": ["list of required documents"]
      },
      "matchScore": "percentage match with user profile"
    }
  ],
  "costs": {
    "tuition": "detailed breakdown",
    "living": "monthly living costs by city",
    "accommodation": "housing options and costs",
    "insurance": "health insurance costs",
    "total": "total estimated costs"
  },
  "visa": {
    "type": "visa category",
    "requirements": ["detailed requirements"],
    "timeline": "processing timeline",
    "documents": ["specific documents needed"],
    "tips": ["country-specific visa tips"]
  },
  "scholarships": [
    {
      "name": "scholarship name",
      "amount": "funding amount",
      "eligibility": "specific criteria",
      "deadline": "application deadline",
      "applicationProcess": "how to apply"
    }
  ],
  "steps": [
    {
      "step": 1,
      "title": "step title",
      "description": "detailed description",
      "duration": "time required",
      "deadline": "specific deadline",
      "documents": ["required documents"],
      "tasks": ["specific tasks to complete"],
      "status": "pending",
      "priority": "high/medium/low"
    }
  ],
  "monthlyTimeline": [
    {
      "month": "Month name",
      "tasks": ["specific tasks for this month"],
      "deadlines": ["important deadlines"],
      "focus": "main focus area"
    }
  ],
  "tips": ["detailed country and university specific tips"],
  "alternatives": [
    {
      "option": "alternative pathway",
      "description": "detailed description",
      "pros": ["advantages"],
      "cons": ["disadvantages"]
    }
  ]
}

Make the analysis as detailed and personalized as possible based on the user's specific profile and selected pathway.
`;
  }

  /**
   * Generate a study abroad pathway using Gemini AI
   * This is used as a fallback when database is empty
   * @param {Object} userProfile - User profile data
   * @returns {Object} AI generated pathway
   */
  async generatePathwayWithAI(userProfile) {
    try {
      console.log('Generating pathway with AI for:', userProfile.preferredCountry, userProfile.desiredCourse);
      
      // Prepare profile data for AI generation
      const profile = {
        country: userProfile.preferredCountry,
        course: userProfile.desiredCourse,
        academicLevel: userProfile.academicLevel,
        budgetRange: userProfile.budgetRange || { min: 25000, max: 50000 },
        nationality: userProfile.nationality || 'International'
      };
      
      // Use pathwayScrapingService to generate the pathway
      const aiGeneratedPathway = await pathwayScrapingService.generatePathwayWithAI(profile);
      
      if (!aiGeneratedPathway) {
        throw new Error('Failed to generate pathway with AI');
      }
      
      // Add metadata to the AI generated pathway
      const pathwayWithMetadata = {
        ...aiGeneratedPathway,
        id: this.generatePathwayId(profile.country, profile.course, profile.academicLevel),
        country: profile.country,
        course: profile.course,
        academicLevel: profile.academicLevel,
        generatedBy: 'Gemini AI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Successfully generated pathway with AI');
      return pathwayWithMetadata;
    } catch (error) {
      console.error('Error generating pathway with AI:', error);
      return null;
    }
  }

  /**
   * Save AI-generated pathway as a template for future use
   * @param {Object} pathway - The AI-generated pathway
   */
  async savePathwayTemplate(pathway) {
    try {
      const pathwayId = pathway.id || this.generatePathwayId(pathway.country, pathway.course, pathway.academicLevel);
      
      // Check if template already exists
      const existingTemplate = await this.getExistingPathway(pathwayId);
      
      if (!existingTemplate) {
        // Save as template in the pathways collection
        await setDoc(doc(db, this.pathwaysCollection, pathwayId), {
          ...pathway,
          id: pathwayId,
          isTemplate: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Saved AI-generated pathway as template for future use');
      } else {
        console.log('Template already exists, skipping save');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving pathway template:', error);
      return false;
    }
  }
  
  /**
   * Create a limited version of the pathway for free users
   * Provides basic information while hiding premium details
   * @param {Object} fullPathway - The complete pathway data
   * @returns {Object} Limited pathway with basic information
   */
  createLimitedPathwayForFreeUsers(fullPathway) {
    try {
      // Basic metadata to keep
      const limitedPathway = {
        id: fullPathway.id,
        country: fullPathway.country,
        course: fullPathway.course,
        academicLevel: fullPathway.academicLevel,
        createdAt: fullPathway.createdAt,
        updatedAt: fullPathway.updatedAt,
        
        // Keep universities but limit the number and details
        universities: fullPathway.universities 
          ? fullPathway.universities.slice(0, 3).map(uni => ({
              name: uni.name,
              ranking: uni.ranking,
              location: uni.location
              // Remove tuition, detailed requirements, specialties, etc.
            }))
          : [],
        
        // Keep timeline but limit details
        timeline: fullPathway.timeline 
          ? fullPathway.timeline.slice(0, 3).map(item => ({
              month: item.month,
              timeFromStart: item.timeFromStart,
              tasks: item.tasks ? item.tasks.slice(0, 2) : []
              // Remove priority, documents, etc.
            }))
          : [],
          
        // Basic visa information only
        visaRequirements: fullPathway.visaRequirements
          ? {
              type: fullPathway.visaRequirements.type,
              processingTime: fullPathway.visaRequirements.processingTime
              // Remove detailed requirements, fees, etc.
            }
          : {},
          
        // Basic costs only
        costs: fullPathway.costs
          ? {
              tuition: {
                annual: fullPathway.costs.tuition?.annual
              },
              totalEstimate: fullPathway.costs.totalEstimate
              // Remove detailed breakdown
            }
          : {},
          
        // Remove documents, scholarships, language requirements, etc.
        
        // Add upgrade message
        isPremiumContentLimited: true,
        upgradeMessage: "Upgrade to Premium or Pro to access detailed pathway information, including scholarship opportunities, document requirements, and university-specific preparation steps."
      };
      
      // Add steps from fullPathway or create basic steps
      limitedPathway.steps = fullPathway.steps 
        ? fullPathway.steps.slice(0, 5).map(step => ({
            step: step.step,
            title: step.title,
            description: step.description,
            duration: step.duration,
            // Remove detailed tasks and other information
            tasks: step.tasks ? [step.tasks[0], "... Upgrade for more details"] : [],
            status: "pending",
            isLimited: true
          }))
        : this.createBasicSteps(fullPathway.country, fullPathway.course);
      
      return limitedPathway;
    } catch (error) {
      console.error('Error creating limited pathway for free users:', error);
      // If there's an error, return a very basic pathway
      return {
        id: fullPathway.id,
        country: fullPathway.country,
        course: fullPathway.course,
        academicLevel: fullPathway.academicLevel,
        isPremiumContentLimited: true,
        upgradeMessage: "Upgrade to Premium or Pro to access detailed pathway information.",
        steps: this.createBasicSteps(fullPathway.country, fullPathway.course)
      };
    }
  }
  
  /**
   * Create basic steps for free users when detailed steps aren't available
   * @param {string} country - Target country
   * @param {string} course - Desired course
   * @returns {Array} Basic pathway steps
   */
  createBasicSteps(country, course) {
    return [
      {
        step: 1,
        title: "Academic Preparation",
        description: "Prepare your academic credentials",
        duration: "6-12 months",
        tasks: ["Maintain/improve your GPA", "... Upgrade for more details"],
        status: "pending",
        isLimited: true
      },
      {
        step: 2,
        title: "Standardized Tests",
        description: "Prepare and take required standardized tests",
        duration: "3-6 months",
        tasks: ["Research required tests", "... Upgrade for more details"],
        status: "pending",
        isLimited: true
      },
      {
        step: 3,
        title: "University Research",
        description: "Research and shortlist universities",
        duration: "2-3 months",
        tasks: ["Check admission requirements", "... Upgrade for more details"],
        status: "pending",
        isLimited: true
      },
      {
        step: 4,
        title: "Application Process",
        description: "Apply to selected universities",
        duration: "2-3 months",
        tasks: ["Prepare application documents", "... Upgrade for more details"],
        status: "pending",
        isLimited: true
      },
      {
        step: 5,
        title: "Visa Application",
        description: "Apply for student visa",
        duration: "2-3 months",
        tasks: ["Gather required documents", "... Upgrade for more details"],
        status: "pending",
        isLimited: true
      }
    ];
  }
  
  /**
   * Get university recommendations using AI
   * @param {Object} profile - User profile with preferred country, course, etc.
   * @returns {Array} - List of university recommendations
   */
  async getUniversityRecommendations(profile) {
    try {
      console.log('Getting AI-powered university recommendations');
      
      // First check if we can find universities in existing pathways
      const existingPathways = await this.findSimilarPathways(profile);
      
      if (existingPathways && existingPathways.length > 0 && existingPathways[0].universities) {
        console.log('Found universities in existing pathway');
        return existingPathways[0].universities.slice(0, 5); // Return top 5 universities
      }
      
      // If no universities in existing pathways, generate them with AI
      console.log('No universities found, generating with AI');
      const partialPathway = await pathwayScrapingService.generatePathwayWithAI({
        ...profile,
        universityOnly: true // Flag to optimize AI generation
      });
      
      if (partialPathway && partialPathway.universities) {
        return partialPathway.universities.slice(0, 5);
      }
      
      throw new Error('Failed to generate university recommendations');
    } catch (error) {
      console.error('Error getting university recommendations:', error);
      throw error;
    }
  }
  
  /**
   * Get scholarship opportunities using AI
   * @param {Object} profile - User profile with preferred country, course, etc.
   * @returns {Array} - List of scholarship opportunities
   */
  async getScholarshipOpportunities(profile) {
    try {
      console.log('Getting AI-powered scholarship opportunities');
      
      // First check if we can find scholarships in existing pathways
      const existingPathways = await this.findSimilarPathways(profile);
      
      if (existingPathways && existingPathways.length > 0 && existingPathways[0].scholarships) {
        console.log('Found scholarships in existing pathway');
        return existingPathways[0].scholarships.slice(0, 3); // Return top 3 scholarships
      }
      
      // If no scholarships in existing pathways, generate them with AI
      console.log('No scholarships found, generating with AI');
      const partialPathway = await pathwayScrapingService.generatePathwayWithAI({
        ...profile,
        scholarshipOnly: true // Flag to optimize AI generation
      });
      
      if (partialPathway && partialPathway.scholarships) {
        return partialPathway.scholarships.slice(0, 3);
      }
      
      throw new Error('Failed to generate scholarship opportunities');
    } catch (error) {
      console.error('Error getting scholarship opportunities:', error);
      throw error;
    }
  }
  
  /**
   * Get pathway steps using AI
   * @param {Object} profile - User profile with preferred country, course, etc.
   * @returns {Array} - List of pathway steps
   */
  async getPathwaySteps(profile) {
    try {
      console.log('Getting AI-powered pathway steps');
      
      // First check if we can find steps in existing pathways
      const existingPathways = await this.findSimilarPathways(profile);
      
      if (existingPathways && existingPathways.length > 0 && 
         (existingPathways[0].steps || existingPathways[0].data?.steps)) {
        console.log('Found steps in existing pathway');
        const steps = existingPathways[0].steps || existingPathways[0].data?.steps || [];
        return steps.map(step => ({
          ...step,
          isLimited: true
        }));
      }
      
      // If no steps in existing pathways, generate them with AI
      console.log('No steps found, generating with AI');
      const partialPathway = await pathwayScrapingService.generatePathwayWithAI({
        ...profile,
        stepsOnly: true // Flag to optimize AI generation
      });
      
      if (partialPathway && partialPathway.steps) {
        return partialPathway.steps.map(step => ({
          ...step,
          isLimited: true
        }));
      }
      
      throw new Error('Failed to generate pathway steps');
    } catch (error) {
      console.error('Error getting pathway steps:', error);
      throw error;
    }
  }
}

export default new StudyAbroadService();
