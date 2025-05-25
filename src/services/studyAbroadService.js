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
import { db } from '../firebaseConfig';

// Study Abroad Service for UniGuidePro Feature
class StudyAbroadService {
  constructor() {
    this.pathwaysCollection = 'studyAbroadPathways';
    this.userPathwaysCollection = 'userStudyAbroadPathways';
  }

  /**
   * Generate or retrieve a personalized study abroad roadmap
   * @param {Object} userProfile - User's academic and preference data
   * @returns {Object} - Complete study abroad pathway
   */
  async generatePathway(userProfile) {
    try {
      const {
        userId,
        preferredCountry,
        desiredCourse,
        academicLevel,
        budget,
        targetCompany,
        currentGPA,
        englishProficiency,
        workExperience
      } = userProfile;

      // Create a unique pathway ID based on preferences
      const pathwayId = this.generatePathwayId(preferredCountry, desiredCourse, academicLevel);

      // Check if pathway already exists
      const existingPathway = await this.getExistingPathway(pathwayId);
      
      if (existingPathway) {
        // Personalize existing pathway for the user
        const personalizedPathway = await this.personalizePathway(existingPathway, userProfile);
        await this.saveUserPathway(userId, personalizedPathway);
        return personalizedPathway;
      }      // Generate new pathway
      const newPathway = await this.createNewPathway(userProfile);
      
      // Save user pathway (don't save to global collection for regular users)
      await this.saveUserPathway(userId, newPathway);

      return newPathway;
    } catch (error) {
      console.error('Error generating study abroad pathway:', error);
      throw new Error('Failed to generate study abroad pathway');
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
   * Create a new comprehensive study abroad pathway using AI/Google API
   */
  async createNewPathway(userProfile) {
    try {
      // Generate a specification hash to check if we already have this pathway
      const specHash = this.generateSpecificationHash(userProfile);
      
      // Check if we already have a pathway for this specification
      const existingPathway = await this.getPathwayBySpecification(specHash);
      if (existingPathway) {
        console.log('Found existing pathway for similar specification');
        return existingPathway;
      }

      console.log('Generating new pathway using AI API for specification:', specHash);
      
      // Generate pathway using external AI service
      const aiGeneratedPathway = await this.generatePathwayWithAI(userProfile);
      
      // Save the generated pathway to database for future reuse
      await this.savePathwaySpecification(specHash, aiGeneratedPathway, userProfile);
      
      return aiGeneratedPathway;
    } catch (error) {
      console.error('Error creating pathway with AI:', error);
      // Fallback to static generation if AI fails
      console.log('Falling back to static pathway generation');
      return this.createStaticPathway(userProfile);
    }
  }

  /**
   * Generate a specification hash based on user profile key characteristics
   */
  generateSpecificationHash(userProfile) {
    const {
      preferredCountry,
      desiredCourse,
      academicLevel,
      currentGPA,
      nationality,
      budget
    } = userProfile;

    // Create a hash based on key specifications that affect pathway
    const spec = {
      country: preferredCountry?.toLowerCase() || 'unknown',
      course: desiredCourse?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      level: academicLevel?.toLowerCase() || 'unknown',
      gpaRange: this.getGPARange(currentGPA),
      nationality: nationality?.toLowerCase() || 'unknown',
      budgetRange: this.getBudgetRange(budget)
    };

    // Create a consistent hash
    return `${spec.country}_${spec.course}_${spec.level}_${spec.gpaRange}_${spec.nationality}_${spec.budgetRange}`;
  }

  /**
   * Get GPA range for specification
   */
  getGPARange(gpa) {
    if (!gpa || gpa < 2.5) return 'low';
    if (gpa < 3.0) return 'medium';
    if (gpa < 3.5) return 'high';
    return 'excellent';
  }

  /**
   * Get budget range for specification
   */
  getBudgetRange(budget) {
    if (!budget || !budget.max) return 'unknown';
    const maxBudget = budget.max;
    if (maxBudget < 20000) return 'low';
    if (maxBudget < 40000) return 'medium';
    if (maxBudget < 70000) return 'high';
    return 'premium';
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
   * Save user-specific pathway
   */
  async saveUserPathway(userId, pathway) {
    try {
      const userPathwayId = `${userId}_${pathway.id}`;
      await setDoc(doc(db, this.userPathwaysCollection, userPathwayId), {
        ...pathway,
        userId,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error saving user pathway:', error);
      throw error;
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
  }
  /**
   * Save or update user pathway with improved history management
   */
  async saveUserPathway(userId, pathwayData) {
    try {
      // Create unique pathway ID with timestamp for history
      const userPathwayId = `${userId}_${pathwayData.country}_${pathwayData.course}_${Date.now()}`;
      const pathwayWithMeta = {
        ...pathwayData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add metadata for better tracking
        pathwayType: 'user_generated',
        isActive: true
      };

      // Save to user pathways collection
      await setDoc(doc(db, this.userPathwaysCollection, userPathwayId), pathwayWithMeta);
      
      // Mark any previous pathways for same country as inactive
      await this.markPreviousPathwaysInactive(userId, pathwayData.country, userPathwayId);
      
      return userPathwayId;
    } catch (error) {
      console.error('Error saving user pathway:', error);
      throw new Error('Failed to save pathway');
    }
  }

  /**
   * Mark previous pathways as inactive to maintain history
   */
  async markPreviousPathwaysInactive(userId, country, excludeId) {
    try {
      const userPathwaysQuery = query(
        collection(db, this.userPathwaysCollection),
        where('userId', '==', userId),
        where('country', '==', country),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(userPathwaysQuery);
      
      // Update previous pathways to inactive
      const updatePromises = snapshot.docs
        .filter(doc => doc.id !== excludeId)
        .map(doc => 
          updateDoc(doc.ref, { 
            isActive: false, 
            updatedAt: new Date().toISOString() 
          })
        );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking previous pathways inactive:', error);
      // Don't throw error - this is not critical for pathway saving
    }
  }

  /**
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
   * Admin: Get all user pathways with statistics
   */
  async getAllUserPathways() {
    try {
      const q = query(
        collection(db, this.userPathwaysCollection),
        orderBy('createdAt', 'desc')
      );
      
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
      console.error('Error fetching all user pathways:', error);
      return [];
    }
  }
  /**
   * Get user's pathway history
   * @param {string} userId - User ID
   * @returns {Array} - Array of user's pathways
   */
  async getUserPathwayHistory(userId) {
    try {
      const userPathwaysRef = collection(db, this.userPathwaysCollection);
      // Use a simpler query that doesn't require a composite index
      const q = query(
        userPathwaysRef,
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
      console.error('Error fetching user pathway history:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  }

  // Helper methods for data generation
  getAverageSalary(course, country) {
    // Implementation for average salary data
    return 'Data varies by specialization and experience';
  }

  getJobMarket(course, country) {
    // Implementation for job market analysis
    return 'Generally positive outlook';
  }

  getTopEmployers(course, country) {
    // Implementation for top employers list
    return ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta'];
  }

  getCareerPaths(course) {
    // Implementation for career paths
    return ['Technical Specialist', 'Project Manager', 'Research Scientist', 'Entrepreneur'];
  }

  getPostStudyWorkRights(country) {
    const workRights = {
      'United States': 'OPT: 12 months (36 months for STEM)',
      'United Kingdom': 'Graduate Route: 2 years (3 years for PhD)',
      'Canada': 'PGWP: Up to 3 years based on study duration',
      'Australia': 'Temporary Graduate visa: 2-4 years'
    };
    return workRights[country] || 'Varies by country and program';
  }

  async getTargetCompanyInfo(company, country) {
    // Implementation for target company information
    return {
      name: company,
      locations: ['Multiple locations'],
      hiringTrends: 'Active recruitment',
      requirements: 'Strong technical skills, relevant degree'
    };
  }

  assessBudgetAlignment(totalCosts, userBudget) {
    const minCost = totalCosts.min;
    const maxCost = totalCosts.max;
    
    if (userBudget >= maxCost) {
      return { status: 'excellent', message: 'Budget covers all expenses comfortably' };
    } else if (userBudget >= minCost) {
      return { status: 'good', message: 'Budget covers basic expenses, consider scholarships for premium options' };
    } else {
      return { status: 'challenging', message: 'Budget below minimum requirements, scholarships/financial aid essential' };
    }
  }

  /**
   * Get pathway by specification hash from database
   */
  async getPathwayBySpecification(specHash) {
    try {
      const specDoc = await getDoc(doc(db, 'pathwaySpecifications', specHash));
      if (specDoc.exists()) {
        const data = specDoc.data();
        console.log(`Found cached pathway for specification: ${specHash}`);
        return data.pathway;
      }
      return null;
    } catch (error) {
      console.error('Error fetching pathway by specification:', error);
      return null;
    }
  }

  /**
   * Save pathway specification to database for future reuse
   */
  async savePathwaySpecification(specHash, pathway, userProfile) {
    try {
      await setDoc(doc(db, 'pathwaySpecifications', specHash), {
        specHash,
        pathway,
        userProfile: {
          country: userProfile.preferredCountry,
          course: userProfile.desiredCourse,
          academicLevel: userProfile.academicLevel,
          gpaRange: this.getGPARange(userProfile.currentGPA),
          nationality: userProfile.nationality,
          budgetRange: this.getBudgetRange(userProfile.budget)
        },
        createdAt: new Date().toISOString(),
        usageCount: 1,
        lastUsed: new Date().toISOString()
      });
      console.log(`Saved pathway specification: ${specHash}`);
    } catch (error) {
      console.error('Error saving pathway specification:', error);
    }
  }

  /**
   * Generate pathway using AI/Google API
   */
  async generatePathwayWithAI(userProfile) {
    try {
      // Prepare the prompt for AI
      const prompt = this.createAIPrompt(userProfile);
      
      // Call external AI service (Google Gemini, OpenAI, etc.)
      const aiResponse = await this.callAIService(prompt);
      
      // Parse and structure the AI response
      return this.parseAIResponse(aiResponse, userProfile);
    } catch (error) {
      console.error('Error generating pathway with AI:', error);
      throw error;
    }
  }

  /**
   * Create AI prompt based on user profile
   */
  createAIPrompt(userProfile) {
    const {
      preferredCountry,
      desiredCourse,
      academicLevel,
      currentGPA,
      englishProficiency,
      standardizedTests,
      budget,
      nationality,
      timeline
    } = userProfile;

    return `Generate a comprehensive study abroad pathway for the following student profile:

**Student Details:**
- Nationality: ${nationality}
- Academic Level: ${academicLevel}
- Current GPA: ${currentGPA}
- Preferred Country: ${preferredCountry}
- Desired Course: ${desiredCourse}
- Budget Range: $${budget?.min || 0} - $${budget?.max || 100000}
- Target Intake: ${timeline?.targetIntake} ${timeline?.targetYear}

**Current Test Scores:**
- IELTS: ${englishProficiency?.ielts || 'Not taken'}
- TOEFL: ${englishProficiency?.toefl || 'Not taken'}
- GRE: ${standardizedTests?.gre || 'Not taken'}

**Requirements:**
1. Generate 8-10 detailed steps for the study abroad journey
2. Include accurate country-specific requirements for ${preferredCountry}
3. Provide realistic timelines for each step
4. Include only relevant tests (no Abitur/TestAS for MS in Germany)
5. Suggest top 5 universities with accurate fees
6. Include visa information and work permissions
7. Provide scholarship opportunities
8. Include country-specific tips and advice

**Important Notes:**
- For Master's in Germany: No Abitur or TestAS required
- Focus on practical, actionable advice
- Include accurate cost breakdowns
- Mention relevant work opportunities during/after studies

Please provide the response in a structured JSON format with the following sections:
- steps (array of step objects with title, description, duration, tasks, status)
- universities (array of university objects)
- costs (object with tuition, living, miscellaneous)
- visaInfo (object with type, requirements, workPermissions)
- scholarships (array of scholarship opportunities)
- tips (array of country-specific tips)
- timeline (object with phases and durations)`;
  }

  /**
   * Call AI service (implement your preferred AI service here)
   */
  async callAIService(prompt) {
    try {
      // Option 1: Google Gemini API
      if (process.env.VITE_GOOGLE_AI_API_KEY) {
        return await this.callGoogleGemini(prompt);
      }
      
      // Option 2: OpenAI API
      if (process.env.VITE_OPENAI_API_KEY) {
        return await this.callOpenAI(prompt);
      }
      
      // Option 3: Local AI service or fallback
      console.warn('No AI API key found, using fallback generation');
      throw new Error('No AI service available');
      
    } catch (error) {
      console.error('AI service call failed:', error);
      throw error;
    }
  }

  /**
   * Call Google Gemini API
   */
  async callGoogleGemini(prompt) {
    try {
      const apiKey = process.env.VITE_GOOGLE_AI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Google Gemini:', error);
      throw error;
    }
  }
  /**
   * Call OpenAI API (alternative)
   */
  async callOpenAI(prompt) {
    try {
      const apiKey = process.env.VITE_OPENAI_API_KEY;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert study abroad counselor. Provide accurate, detailed guidance for international students.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 8000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  /**
   * Parse AI response and structure it into pathway format
   */
  parseAIResponse(aiResponse, userProfile) {
    try {
      // Clean the response and try to extract JSON
      let cleanResponse = aiResponse.trim();
      
      // Remove code block markers if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      // Try to parse as JSON
      let parsedData;
      try {
        parsedData = JSON.parse(cleanResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      }

      // Structure the pathway according to our format
      const pathway = {
        id: this.generatePathwayId(
          userProfile.preferredCountry, 
          userProfile.desiredCourse, 
          userProfile.academicLevel
        ),
        country: userProfile.preferredCountry,
        course: userProfile.desiredCourse,
        academicLevel: userProfile.academicLevel,
        generatedAt: new Date().toISOString(),
        generatedBy: 'AI',
        
        // Parse steps from AI response
        steps: this.parseAISteps(parsedData.steps),
        
        // Parse universities from AI response
        universities: this.parseAIUniversities(parsedData.universities || []),
        
        // Parse costs from AI response
        costs: this.parseAICosts(parsedData.costs || {}),
        
        // Parse visa information
        visaInfo: this.parseAIVisaInfo(parsedData.visaInfo || {}),
        
        // Parse scholarships
        scholarships: this.parseAIScholarships(parsedData.scholarships || []),
        
        // Parse tips
        tips: parsedData.tips || [],
        
        // Parse timeline
        timeline: this.parseAITimeline(parsedData.timeline || {}),
        
        // Add metadata
        requirements: {
          academic: this.getAcademicRequirements(userProfile.preferredCountry, userProfile.desiredCourse),
          documents: this.getDocumentRequirements(userProfile.preferredCountry),
          financial: this.getFinancialRequirements(userProfile.preferredCountry),
          language: this.getLanguageRequirements(userProfile.preferredCountry, 'intermediate')
        }
      };

      return pathway;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to static generation if parsing fails
      console.log('AI response parsing failed, falling back to static generation');
      return this.createStaticPathway(userProfile);
    }
  }

  /**
   * Parse AI steps response
   */
  parseAISteps(aiSteps) {
    if (!Array.isArray(aiSteps)) return this.getDefaultSteps();
    
    return aiSteps.map((step, index) => ({
      step: index + 1,
      title: step.title || `Step ${index + 1}`,
      description: step.description || '',
      duration: step.duration || '1-2 months',
      tasks: Array.isArray(step.tasks) ? step.tasks : [step.tasks || 'Complete this step'],
      status: 'pending'
    }));
  }

  /**
   * Parse AI universities response
   */
  parseAIUniversities(aiUniversities) {
    if (!Array.isArray(aiUniversities)) return [];
    
    return aiUniversities.slice(0, 5).map((uni, index) => ({
      name: uni.name || `University ${index + 1}`,
      ranking: uni.ranking || null,
      location: uni.location || '',
      tuitionFee: uni.tuitionFee || uni.fees || 'Contact university',
      requirements: uni.requirements || [],
      website: uni.website || '',
      reputation: uni.reputation || 'Good'
    }));
  }

  /**
   * Parse AI costs response
   */
  parseAICosts(aiCosts) {
    return {
      tuition: {
        min: aiCosts.tuition?.min || aiCosts.tuition || 20000,
        max: aiCosts.tuition?.max || aiCosts.tuition || 50000,
        currency: 'USD'
      },
      living: {
        min: aiCosts.living?.min || aiCosts.living || 15000,
        max: aiCosts.living?.max || aiCosts.living || 25000,
        currency: 'USD'
      },
      miscellaneous: {
        min: aiCosts.miscellaneous?.min || aiCosts.miscellaneous || 5000,
        max: aiCosts.miscellaneous?.max || aiCosts.miscellaneous || 10000,
        currency: 'USD'
      },
      total: {
        min: (aiCosts.tuition?.min || 20000) + (aiCosts.living?.min || 15000) + (aiCosts.miscellaneous?.min || 5000),
        max: (aiCosts.tuition?.max || 50000) + (aiCosts.living?.max || 25000) + (aiCosts.miscellaneous?.max || 10000),
        currency: 'USD'
      }
    };
  }

  /**
   * Parse AI visa information
   */
  parseAIVisaInfo(aiVisaInfo) {
    return {
      type: aiVisaInfo.type || 'Student Visa',
      requirements: Array.isArray(aiVisaInfo.requirements) ? aiVisaInfo.requirements : [],
      workPermissions: aiVisaInfo.workPermissions || 'Limited work allowed',
      processingTime: aiVisaInfo.processingTime || '2-4 weeks'
    };
  }

  /**
   * Parse AI scholarships response
   */
  parseAIScholarships(aiScholarships) {
    if (!Array.isArray(aiScholarships)) return [];
    
    return aiScholarships.map(scholarship => ({
      name: scholarship.name || 'Scholarship Opportunity',
      amount: scholarship.amount || 'Varies',
      eligibility: Array.isArray(scholarship.eligibility) ? scholarship.eligibility : [scholarship.eligibility || 'Check requirements'],
      deadline: scholarship.deadline || 'Check website'
    }));
  }

  /**
   * Parse AI timeline response
   */
  parseAITimeline(aiTimeline) {
    return {
      totalDuration: aiTimeline.totalDuration || '18-24 months',
      phases: Array.isArray(aiTimeline.phases) ? aiTimeline.phases : [
        { phase: 'Preparation', duration: '12-18 months', description: 'Academic prep, tests, research' },
        { phase: 'Application', duration: '3-6 months', description: 'Apply to universities' },
        { phase: 'Decision & Visa', duration: '3-4 months', description: 'Accept offers, visa process' }
      ]
    };
  }

  /**
   * Create static pathway as fallback when AI fails
   */
  createStaticPathway(userProfile) {
    const {
      preferredCountry,
      desiredCourse,
      academicLevel,
      budget,
      currentGPA,
      englishProficiency
    } = userProfile;

    const pathwayId = this.generatePathwayId(preferredCountry, desiredCourse, academicLevel);
    
    return {
      id: pathwayId,
      country: preferredCountry,
      course: desiredCourse,
      academicLevel: academicLevel,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Static',
      
      // Generate steps using existing methods
      steps: this.getDefaultSteps(userProfile),
      
      // Generate universities using existing data
      universities: this.getDefaultUniversities(preferredCountry, desiredCourse),
      
      // Generate costs using existing methods
      costs: this.getDefaultCosts(preferredCountry, academicLevel),
      
      // Generate visa info
      visaInfo: this.getDefaultVisaInfo(preferredCountry),
      
      // Generate scholarships
      scholarships: this.getDefaultScholarships(preferredCountry, desiredCourse),
      
      // Generate tips
      tips: this.generateCountrySpecificTips(preferredCountry),
      
      // Generate timeline
      timeline: this.generateTimeline(academicLevel),
      
      // Requirements
      requirements: {
        academic: this.getAcademicRequirements(preferredCountry, desiredCourse),
        documents: this.getDocumentRequirements(preferredCountry),
        financial: this.getFinancialRequirements(preferredCountry),
        language: this.getLanguageRequirements(preferredCountry, 'intermediate')
      }
    };
  }

  /**
   * Get default steps for fallback
   */
  getDefaultSteps(userProfile) {
    const { academicLevel, preferredCountry, englishProficiency } = userProfile;
    
    return [
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
        tasks: this.getVisaPreparationTasks(preferredCountry),
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
  }

  /**
   * Get default universities for fallback
   */
  getDefaultUniversities(country, course) {
    const universityData = {
      'United States': [
        { name: 'Stanford University', ranking: '#2', location: 'California', tuitionFee: '$55,000', reputation: 'Excellent' },
        { name: 'MIT', ranking: '#1', location: 'Massachusetts', tuitionFee: '$53,000', reputation: 'Excellent' },
        { name: 'UC Berkeley', ranking: '#4', location: 'California', tuitionFee: '$45,000', reputation: 'Excellent' },
        { name: 'Carnegie Mellon', ranking: '#7', location: 'Pennsylvania', tuitionFee: '$57,000', reputation: 'Excellent' },
        { name: 'University of Washington', ranking: '#15', location: 'Washington', tuitionFee: '$38,000', reputation: 'Very Good' }
      ],
      'United Kingdom': [
        { name: 'University of Cambridge', ranking: '#2', location: 'England', tuitionFee: '£35,000', reputation: 'Excellent' },
        { name: 'University of Oxford', ranking: '#1', location: 'England', tuitionFee: '£35,000', reputation: 'Excellent' },
        { name: 'Imperial College London', ranking: '#3', location: 'London', tuitionFee: '£32,000', reputation: 'Excellent' },
        { name: 'University College London', ranking: '#8', location: 'London', tuitionFee: '£28,000', reputation: 'Excellent' },
        { name: 'University of Edinburgh', ranking: '#15', location: 'Scotland', tuitionFee: '£25,000', reputation: 'Very Good' }
      ],
      'Canada': [
        { name: 'University of Toronto', ranking: '#18', location: 'Ontario', tuitionFee: 'CAD $45,000', reputation: 'Excellent' },
        { name: 'University of British Columbia', ranking: '#34', location: 'Vancouver', tuitionFee: 'CAD $42,000', reputation: 'Excellent' },
        { name: 'McGill University', ranking: '#27', location: 'Montreal', tuitionFee: 'CAD $38,000', reputation: 'Excellent' },
        { name: 'University of Waterloo', ranking: '#166', location: 'Ontario', tuitionFee: 'CAD $35,000', reputation: 'Very Good' },
        { name: 'University of Alberta', ranking: '#119', location: 'Alberta', tuitionFee: 'CAD $32,000', reputation: 'Very Good' }
      ],
      'Germany': [
        { name: 'Technical University of Munich', ranking: '#50', location: 'Munich', tuitionFee: '€500/semester', reputation: 'Excellent' },
        { name: 'RWTH Aachen University', ranking: '#106', location: 'Aachen', tuitionFee: '€300/semester', reputation: 'Excellent' },
        { name: 'University of Heidelberg', ranking: '#64', location: 'Heidelberg', tuitionFee: '€350/semester', reputation: 'Excellent' },
        { name: 'Humboldt University', ranking: '#120', location: 'Berlin', tuitionFee: '€300/semester', reputation: 'Very Good' },
        { name: 'University of Stuttgart', ranking: '#279', location: 'Stuttgart', tuitionFee: '€350/semester', reputation: 'Very Good' }
      ],
      'Australia': [
        { name: 'University of Melbourne', ranking: '#33', location: 'Melbourne', tuitionFee: 'AUD $45,000', reputation: 'Excellent' },
        { name: 'Australian National University', ranking: '#30', location: 'Canberra', tuitionFee: 'AUD $43,000', reputation: 'Excellent' },
        { name: 'University of Sydney', ranking: '#41', location: 'Sydney', tuitionFee: 'AUD $48,000', reputation: 'Excellent' },
        { name: 'University of Queensland', ranking: '#47', location: 'Brisbane', tuitionFee: 'AUD $40,000', reputation: 'Excellent' },
        { name: 'Monash University', ranking: '#58', location: 'Melbourne', tuitionFee: 'AUD $42,000', reputation: 'Very Good' }
      ]
    };

    return universityData[country] || universityData['United States'];
  }

  /**
   * Get default costs for fallback
   */
  getDefaultCosts(country, academicLevel) {
    const costData = {
      'United States': {
        tuition: { min: 30000, max: 60000, currency: 'USD' },
        living: { min: 15000, max: 25000, currency: 'USD' },
        miscellaneous: { min: 5000, max: 10000, currency: 'USD' }
      },
      'United Kingdom': {
        tuition: { min: 20000, max: 40000, currency: 'GBP' },
        living: { min: 12000, max: 18000, currency: 'GBP' },
        miscellaneous: { min: 3000, max: 6000, currency: 'GBP' }
      },
      'Canada': {
        tuition: { min: 25000, max: 45000, currency: 'CAD' },
        living: { min: 12000, max: 20000, currency: 'CAD' },
        miscellaneous: { min: 4000, max: 8000, currency: 'CAD' }
      },
      'Germany': {
        tuition: { min: 500, max: 3000, currency: 'EUR' },
        living: { min: 10000, max: 15000, currency: 'EUR' },
        miscellaneous: { min: 3000, max: 5000, currency: 'EUR' }
      },
      'Australia': {
        tuition: { min: 25000, max: 50000, currency: 'AUD' },
        living: { min: 15000, max: 25000, currency: 'AUD' },
        miscellaneous: { min: 5000, max: 10000, currency: 'AUD' }
      }
    };

    const costs = costData[country] || costData['United States'];
    
    return {
      ...costs,
      total: {
        min: costs.tuition.min + costs.living.min + costs.miscellaneous.min,
        max: costs.tuition.max + costs.living.max + costs.miscellaneous.max,
        currency: costs.tuition.currency
      }
    };
  }

  /**
   * Get default visa info for fallback
   */
  getDefaultVisaInfo(country) {
    const visaData = {
      'United States': {
        type: 'F-1 Student Visa',
        requirements: ['I-20 form', 'SEVIS fee payment', 'Passport', 'Financial documents'],
        workPermissions: 'On-campus work allowed, OPT after graduation',
        processingTime: '2-4 weeks'
      },
      'United Kingdom': {
        type: 'Student Visa (Tier 4)',
        requirements: ['CAS number', 'Financial proof', 'English proficiency', 'TB test'],
        workPermissions: '20 hours/week during studies, 2-year post-study work visa',
        processingTime: '3-4 weeks'
      },
      'Canada': {
        type: 'Study Permit',
        requirements: ['Letter of acceptance', 'Financial proof', 'Medical exam', 'Police clearance'],
        workPermissions: '20 hours/week during studies, 3-year PGWP available',
        processingTime: '4-8 weeks'
      },
      'Germany': {
        type: 'Student Visa (National Visa)',
        requirements: ['Admission letter', 'Financial proof', 'Health insurance', 'Academic credentials'],
        workPermissions: '120 full days or 240 half days per year',
        processingTime: '6-12 weeks'
      },
      'Australia': {
        type: 'Student Visa (Subclass 500)',
        requirements: ['CoE', 'GTE statement', 'Financial capacity', 'Health insurance'],
        workPermissions: '40 hours/fortnight during studies, 2-4 year post-study work visa',
        processingTime: '4-6 weeks'
      }
    };

    return visaData[country] || visaData['United States'];
  }

  /**
   * Get default scholarships for fallback
   */
  getDefaultScholarships(country, course) {
    const scholarshipData = {
      'United States': [
        { name: 'Fulbright Scholarship', amount: 'Full funding', eligibility: ['Academic excellence', 'Leadership potential'] },
        { name: 'Merit-based scholarships', amount: '$5,000-$25,000', eligibility: ['High GPA', 'Test scores'] },
        { name: 'Need-based aid', amount: 'Varies', eligibility: ['Financial need demonstration'] }
      ],
      'United Kingdom': [
        { name: 'Chevening Scholarship', amount: 'Full funding', eligibility: ['Leadership potential', 'Academic merit'] },
        { name: 'Commonwealth Scholarship', amount: 'Full funding', eligibility: ['Commonwealth countries'] },
        { name: 'University scholarships', amount: '£5,000-£15,000', eligibility: ['Academic excellence'] }
      ],
      'Canada': [
        { name: 'Vanier Canada Graduate Scholarships', amount: 'CAD $50,000', eligibility: ['PhD students', 'Academic excellence'] },
        { name: 'Ontario Graduate Scholarship', amount: 'CAD $15,000', eligibility: ['Graduate students in Ontario'] },
        { name: 'University entrance scholarships', amount: 'CAD $5,000-$20,000', eligibility: ['High academic achievement'] }
      ],
      'Germany': [
        { name: 'DAAD Scholarship', amount: '€850-€1,200/month', eligibility: ['Academic excellence', 'Various programs'] },
        { name: 'Deutschlandstipendium', amount: '€300/month', eligibility: ['High achievement', 'Social engagement'] },
        { name: 'Erasmus+', amount: '€200-€300/month', eligibility: ['EU exchange students'] }
      ],
      'Australia': [
        { name: 'Australia Awards Scholarship', amount: 'Full funding', eligibility: ['Developing countries', 'Leadership'] },
        { name: 'Research Training Program', amount: 'AUD $28,000/year', eligibility: ['Research students'] },
        { name: 'University merit scholarships', amount: 'AUD $5,000-$20,000', eligibility: ['Academic excellence'] }
      ]
    };

    return scholarshipData[country] || scholarshipData['United States'];
  }
}

const studyAbroadService = new StudyAbroadService();

// Export individual functions for easier importing
export const getUserPathwayHistory = (userId) => studyAbroadService.getUserPathwayHistory(userId);
export const getUserPathway = (userId) => studyAbroadService.getUserPathway(userId);
export const saveUserPathway = (userId, pathway) => studyAbroadService.saveUserPathway(userId, pathway);
export const updateUserPathwayStep = (userId, stepId, status) => studyAbroadService.updateUserPathwayStep(userId, stepId, status);
export const generatePathwayFromProfile = (profile) => studyAbroadService.generatePathwayFromProfile(profile);

export default studyAbroadService;
