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

// Study Abroad Service for EdVisor Feature
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
   * Create a new comprehensive study abroad pathway
   */
  async createNewPathway(userProfile) {
    const {
      preferredCountry,
      desiredCourse,
      academicLevel,
      targetCompany
    } = userProfile;

    const pathway = {
      id: this.generatePathwayId(preferredCountry, desiredCourse, academicLevel),
      country: preferredCountry,
      course: desiredCourse,
      academicLevel: academicLevel,
      targetCompany: targetCompany || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: await this.generatePathwaySteps(userProfile),
      timeline: this.generateTimeline(academicLevel),
      requirements: await this.generateRequirements(preferredCountry, desiredCourse),
      universities: await this.getRecommendedUniversities(preferredCountry, desiredCourse),
      costs: await this.generateCostBreakdown(preferredCountry, academicLevel),
      visaInfo: await this.getVisaInformation(preferredCountry),
      careerProspects: await this.getCareerProspects(desiredCourse, preferredCountry, targetCompany),
      scholarships: await this.getScholarshipOpportunities(preferredCountry, desiredCourse),
      tips: this.generateCountrySpecificTips(preferredCountry)
    };

    return pathway;
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
      'Germany': ["IELTS/TOEFL for English programs", "German proficiency (B2/C1) for German programs", "TestDaF or DSH for German universities"],
      'Netherlands': ["IELTS Academic (Target: 6.5-7.0)", "TOEFL iBT (Target: 80-100)", "Some programs require higher scores"]
    };

    return requirements[country] || ["Take IELTS Academic (Target: 6.5-7.0)", "Alternative: TOEFL iBT (Target: 80-90)"];
  }

  /**
   * Generate standardized test requirements
   */
  getStandardizedTestRequirements(academicLevel, country) {
    if (academicLevel === 'undergraduate') {
      if (country === 'United States') {
        return ["Take SAT (Target: 1400+)", "Alternative: ACT (Target: 30+)", "Subject-specific SAT Subject Tests (if required)"];
      }
      return ["Check if SAT/ACT required", "Prepare for country-specific entrance exams"];
    } else if (academicLevel === 'graduate') {
      const gradTests = {
        'Engineering': ["Take GRE General (Target: 320+)", "Consider GRE Subject Test"],
        'Business': ["Take GMAT (Target: 650+)", "Alternative: GRE for some programs"],
        'Medicine': ["MCAT for medical programs", "GRE for biomedical programs"],
        'Arts': ["GRE General", "Portfolio submission"],
        'Sciences': ["GRE General and Subject Test", "Research experience documentation"]
      };
      return ["Take GRE General (Target: 310-320)", "Consider program-specific tests", "Prepare research portfolio"];
    }
    return ["Check specific test requirements", "Prepare for entrance examinations"];
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
   */
  getDefaultUniversityRecommendations(country, course) {
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
      ]
    };

    return recommendations[country] || recommendations['United States'];
  }

  /**
   * Generate cost breakdown
   */
  async generateCostBreakdown(country, academicLevel) {
    const costData = {
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
      },
      'Australia': {
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
      ],
      'Australia': [
        'Receive CoE from university',
        'Purchase OSHC insurance',
        'Complete online application',
        'Submit health examinations',
        'Provide biometrics',
        'Submit application'
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
      ],
      'Canada': [
        { name: 'Vanier Canada Graduate Scholarships', amount: 'CAD $50,000', eligibility: 'PhD students' },
        { name: 'Ontario Graduate Scholarship', amount: 'CAD $15,000', eligibility: 'Graduate students in Ontario' },
        { name: 'University Entrance Scholarships', amount: 'CAD $5,000-$20,000', eligibility: 'High school graduates' }
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
      ],
      'Australia': [
        'Understand the academic calendar (February start)',
        'Research recognition of prior learning (RPL)',
        'Consider regional universities for easier visa',
        'Purchase Overseas Student Health Cover (OSHC)',
        'Join orientation programs for integration'
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
        where('userId', '==', userId),
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
      console.error('Error fetching user pathways:', error);
      return [];
    }
  }

  /**
   * Update pathway step status
   */
  async updateStepStatus(userId, pathwayId, stepNumber, status, notes = '') {
    try {
      const userPathwayId = `${userId}_${pathwayId}`;
      const pathwayRef = doc(db, this.userPathwaysCollection, userPathwayId);
      const pathwayDoc = await getDoc(pathwayRef);
      
      if (pathwayDoc.exists()) {
        const pathwayData = pathwayDoc.data();
        const updatedSteps = pathwayData.steps.map(step => {
          if (step.step === stepNumber) {
            return {
              ...step,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : null,
              notes
            };
          }
          return step;
        });

        await updateDoc(pathwayRef, {
          steps: updatedSteps,
          updatedAt: new Date().toISOString()
        });

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating step status:', error);
      throw error;
    }
  }

  /**
   * Admin: Get all pathways
   */
  async getAllPathways() {
    try {
      const q = query(
        collection(db, this.pathwaysCollection),
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
}

export default new StudyAbroadService();
