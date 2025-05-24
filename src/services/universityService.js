import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// University Database Operations
export const universityService = {
  // Get universities with filters and pagination
  async getUniversities(filters = {}, pageSize = 20, lastDoc = null) {
    try {
      let q = collection(db, 'universities');
      
      // Simplified query to avoid index requirements while they're building
      const constraints = [];
      
      // Only add admin_approved filter for now
      if (filters.adminApproved !== undefined) {
        constraints.push(where('admin_approved', '==', filters.adminApproved));
      }
      
      // Add ordering
      constraints.push(orderBy('ranking_overall', 'asc'));
      
      // Add limit - fetch more to account for client-side filtering
      constraints.push(limit(pageSize * 5));
      
      // Add pagination
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      q = query(q, ...constraints);
      
      const snapshot = await getDocs(q);
      let universities = [];
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        
        // Apply filters in memory
        let includeUniversity = true;
        
        if (filters.country && data.country !== filters.country) {
          includeUniversity = false;
        }
        
        if (filters.type && data.type !== filters.type) {
          includeUniversity = false;
        }
        
        if (filters.tuitionMin !== undefined && data.tuition_max < filters.tuitionMin) {
          includeUniversity = false;
        }
        
        if (filters.tuitionMax !== undefined && data.tuition_min > filters.tuitionMax) {
          includeUniversity = false;
        }
        
        if (includeUniversity) {
          universities.push(data);
        }
      });
      
      // Limit to requested page size
      const paginatedUniversities = universities.slice(0, pageSize);
      
      return {
        universities: paginatedUniversities,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: universities.length > pageSize
      };
    } catch (error) {
      console.error('Error fetching universities:', error);
      throw error;
    }
  },

  // Get a single university by ID
  async getUniversity(universityId) {
    try {
      const docRef = doc(db, 'universities', universityId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('University not found');
      }
    } catch (error) {
      console.error('Error fetching university:', error);
      throw error;
    }
  },

  // Search universities by name or program
  async searchUniversities(searchTerm, filters = {}) {
    try {
      // Note: This is a simple implementation. For production, consider using
      // Algolia or implementing full-text search with Cloud Functions
      const { universities } = await this.getUniversities(filters, 100);
      
      const filteredUniversities = universities.filter(university => 
        university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        university.programs_offered.some(program => 
          program.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        university.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredUniversities;
    } catch (error) {
      console.error('Error searching universities:', error);
      throw error;
    }
  },

  // Add a new university (admin only)
  async addUniversity(universityData) {
    try {
      const docRef = await addDoc(collection(db, 'universities'), {
        ...universityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding university:', error);
      throw error;
    }
  },

  // Update university (admin only)
  async updateUniversity(universityId, universityData) {
    try {
      const docRef = doc(db, 'universities', universityId);
      await setDoc(docRef, {
        ...universityData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating university:', error);
      throw error;
    }
  }
};

// User Academic Profile Operations
export const academicProfileService = {
  // Get user's academic profile
  async getAcademicProfile(userId) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        return userData.academic_profile || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching academic profile:', error);
      throw error;
    }
  },

  // Update user's academic profile
  async updateAcademicProfile(userId, profileData) {
    try {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        academic_profile: {
          ...profileData,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating academic profile:', error);
      throw error;
    }
  }
};

// Saved Universities Operations
export const savedUniversitiesService = {
  // Get user's saved universities
  async getSavedUniversities(userId) {
    try {
      const q = query(
        collection(db, 'users', userId, 'saved_universities'),
        orderBy('savedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const savedUniversities = [];
      
      // Get full university details for each saved university
      for (const docSnap of snapshot.docs) {
        const savedData = docSnap.data();
        try {
          const university = await universityService.getUniversity(savedData.universityId);
          savedUniversities.push({
            ...university,
            savedAt: savedData.savedAt
          });
        } catch (error) {
          console.warn(`University ${savedData.universityId} not found, skipping...`);
        }
      }
      
      return savedUniversities;
    } catch (error) {
      console.error('Error fetching saved universities:', error);
      throw error;
    }
  },

  // Save a university
  async saveUniversity(userId, universityId) {
    try {
      const docRef = doc(db, 'users', userId, 'saved_universities', universityId);
      await setDoc(docRef, {
        universityId,
        savedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving university:', error);
      throw error;
    }
  },

  // Remove a saved university
  async removeSavedUniversity(userId, universityId) {
    try {
      const docRef = doc(db, 'users', userId, 'saved_universities', universityId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing saved university:', error);
      throw error;
    }
  },

  // Check if university is saved
  async isUniversitySaved(userId, universityId) {
    try {
      const docRef = doc(db, 'users', userId, 'saved_universities', universityId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking if university is saved:', error);
      return false;
    }
  }
};

// University Matching Algorithm
export const matchingService = {
  // Calculate match score between student and university
  calculateMatchScore(studentProfile, university) {
    let score = 0;
    let maxScore = 0;
    
    // CGPA matching (40% weight)
    if (studentProfile.cgpa && university.cgpa_requirement) {
      maxScore += 40;
      const cgpaRatio = studentProfile.cgpa / university.cgpa_requirement;
      if (cgpaRatio >= 1) {
        score += 40; // Perfect match
      } else if (cgpaRatio >= 0.9) {
        score += 30; // Good match
      } else if (cgpaRatio >= 0.8) {
        score += 20; // Fair match
      }
    }
    
    // English proficiency (30% weight)
    maxScore += 30;
    let englishScore = 0;
    
    if (studentProfile.ielts_score && university.ielts_requirement) {
      const ieltsRatio = studentProfile.ielts_score / university.ielts_requirement;
      if (ieltsRatio >= 1) englishScore = Math.max(englishScore, 30);
      else if (ieltsRatio >= 0.9) englishScore = Math.max(englishScore, 20);
      else if (ieltsRatio >= 0.8) englishScore = Math.max(englishScore, 10);
    }
    
    if (studentProfile.toefl_score && university.toefl_requirement) {
      const toeflRatio = studentProfile.toefl_score / university.toefl_requirement;
      if (toeflRatio >= 1) englishScore = Math.max(englishScore, 30);
      else if (toeflRatio >= 0.9) englishScore = Math.max(englishScore, 20);
      else if (toeflRatio >= 0.8) englishScore = Math.max(englishScore, 10);
    }
    
    score += englishScore;
    
    // Budget matching (20% weight)
    if (studentProfile.budget_max && university.tuition_min) {
      maxScore += 20;
      if (studentProfile.budget_max >= university.tuition_max) {
        score += 20; // Can afford
      } else if (studentProfile.budget_max >= university.tuition_min) {
        score += 10; // Partial afford
      }
    }
    
    // GRE matching (10% weight)
    if (studentProfile.gre_score && university.gre_requirement) {
      maxScore += 10;
      const greRatio = studentProfile.gre_score / university.gre_requirement;
      if (greRatio >= 1) {
        score += 10;
      } else if (greRatio >= 0.9) {
        score += 5;
      }
    }
    
    // Calculate percentage
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Categorize
    let category = 'ambitious';
    if (percentage >= 80) {
      category = 'safety';
    } else if (percentage >= 60) {
      category = 'target';
    }
    
    return {
      score: Math.round(percentage),
      category,
      details: {
        cgpaMatch: studentProfile.cgpa && university.cgpa_requirement ? 
          studentProfile.cgpa >= university.cgpa_requirement : null,
        englishMatch: this.checkEnglishRequirement(studentProfile, university),
        budgetMatch: studentProfile.budget_max && university.tuition_min ? 
          studentProfile.budget_max >= university.tuition_min : null,
        greMatch: studentProfile.gre_score && university.gre_requirement ? 
          studentProfile.gre_score >= university.gre_requirement : null
      }
    };
  },

  checkEnglishRequirement(studentProfile, university) {
    const ieltsMatch = studentProfile.ielts_score && university.ielts_requirement ? 
      studentProfile.ielts_score >= university.ielts_requirement : false;
    const toeflMatch = studentProfile.toefl_score && university.toefl_requirement ? 
      studentProfile.toefl_score >= university.toefl_requirement : false;
    
    return ieltsMatch || toeflMatch;
  },

  // Get matched universities for a student
  async getMatchedUniversities(studentProfile, filters = {}) {
    try {
      // First, get universities based on broad filters
      const broadFilters = {
        ...filters,
        adminApproved: true // Only show approved universities
      };
      
      // Add country filter if student has preferences
      if (studentProfile.preferred_countries && studentProfile.preferred_countries.length > 0) {
        // Note: Firestore doesn't support 'in' with other filters efficiently
        // In production, you might want to fetch separately for each country
        if (!broadFilters.country && studentProfile.preferred_countries.length === 1) {
          broadFilters.country = studentProfile.preferred_countries[0];
        }
      }
      
      // Add budget filter
      if (studentProfile.budget_max) {
        broadFilters.tuitionMax = studentProfile.budget_max;
      }
      
      const { universities } = await universityService.getUniversities(broadFilters, 100);
      
      // Calculate match scores and filter
      const matchedUniversities = universities
        .map(university => ({
          ...university,
          match: this.calculateMatchScore(studentProfile, university)
        }))
        .filter(university => {
          // Filter by preferred countries if specified
          if (studentProfile.preferred_countries && studentProfile.preferred_countries.length > 0) {
            if (!studentProfile.preferred_countries.includes(university.country)) {
              return false;
            }
          }
          
          // Filter by preferred fields of study
          if (studentProfile.preferred_fields_of_study && studentProfile.preferred_fields_of_study.length > 0) {
            const hasMatchingProgram = university.programs_offered.some(program =>
              studentProfile.preferred_fields_of_study.some(field =>
                program.toLowerCase().includes(field.toLowerCase()) ||
                field.toLowerCase().includes(program.toLowerCase())
              )
            );
            if (!hasMatchingProgram) {
              return false;
            }
          }
          
          return true;
        })
        .sort((a, b) => b.match.score - a.match.score); // Sort by match score descending
      
      return matchedUniversities;
    } catch (error) {
      console.error('Error getting matched universities:', error);
      throw error;
    }
  }
};
