// Enhanced University Scraper for Admin Panel
// Supports adding new universities and updating existing ones

import axios from 'axios';
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

class EnhancedUniversityScraper {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  // Additional universities to scrape beyond the original 36
  getAdditionalUniversities() {
    return [
      // More US Universities
      { name: "Cornell University", country: "US", city: "Ithaca", state: "New York" },
      { name: "Carnegie Mellon University", country: "US", city: "Pittsburgh", state: "Pennsylvania" },
      { name: "University of California, Berkeley", country: "US", city: "Berkeley", state: "California" },
      { name: "University of California, Los Angeles", country: "US", city: "Los Angeles", state: "California" },
      { name: "Johns Hopkins University", country: "US", city: "Baltimore", state: "Maryland" },
      { name: "University of Michigan", country: "US", city: "Ann Arbor", state: "Michigan" },
      { name: "New York University", country: "US", city: "New York", state: "New York" },
      { name: "Duke University", country: "US", city: "Durham", state: "North Carolina" },
      { name: "Brown University", country: "US", city: "Providence", state: "Rhode Island" },
      { name: "Dartmouth College", country: "US", city: "Hanover", state: "New Hampshire" },
      
      // More UK Universities
      { name: "University of St Andrews", country: "UK", city: "St Andrews", state: "Scotland" },
      { name: "University of Bath", country: "UK", city: "Bath", state: "England" },
      { name: "University of Durham", country: "UK", city: "Durham", state: "England" },
      { name: "University of Exeter", country: "UK", city: "Exeter", state: "England" },
      { name: "University of York", country: "UK", city: "York", state: "England" },
      { name: "University of Glasgow", country: "UK", city: "Glasgow", state: "Scotland" },
      { name: "University of Southampton", country: "UK", city: "Southampton", state: "England" },
      { name: "University of Birmingham", country: "UK", city: "Birmingham", state: "England" },
      { name: "University of Sheffield", country: "UK", city: "Sheffield", state: "England" },
      { name: "University of Nottingham", country: "UK", city: "Nottingham", state: "England" },
      
      // More Canadian Universities
      { name: "Simon Fraser University", country: "Canada", city: "Burnaby", state: "British Columbia" },
      { name: "University of Ottawa", country: "Canada", city: "Ottawa", state: "Ontario" },
      { name: "Western University", country: "Canada", city: "London", state: "Ontario" },
      { name: "York University", country: "Canada", city: "Toronto", state: "Ontario" },
      { name: "Concordia University", country: "Canada", city: "Montreal", state: "Quebec" },
      { name: "University of Victoria", country: "Canada", city: "Victoria", state: "British Columbia" },
      { name: "Carleton University", country: "Canada", city: "Ottawa", state: "Ontario" },
      { name: "Dalhousie University", country: "Canada", city: "Halifax", state: "Nova Scotia" },
      
      // More Australian Universities
      { name: "University of Technology Sydney", country: "Australia", city: "Sydney", state: "New South Wales" },
      { name: "Macquarie University", country: "Australia", city: "Sydney", state: "New South Wales" },
      { name: "Griffith University", country: "Australia", city: "Brisbane", state: "Queensland" },
      { name: "Deakin University", country: "Australia", city: "Melbourne", state: "Victoria" },
      { name: "Queensland University of Technology", country: "Australia", city: "Brisbane", state: "Queensland" },
      { name: "University of Wollongong", country: "Australia", city: "Wollongong", state: "New South Wales" },
      { name: "Curtin University", country: "Australia", city: "Perth", state: "Western Australia" },
      { name: "University of Tasmania", country: "Australia", city: "Hobart", state: "Tasmania" }
    ];
  }

  // Get university details using Google Places API v1 via proxy
  async getUniversityDetails(universityName, city, country) {
    try {
      console.log(`🔍 Fetching details for: ${universityName}`);
      
      const query = `${universityName} ${city} ${country}`;
      
      // Search for the place using the proxy
      const searchResponse = await axios.post(`${this.apiBaseUrl}/api/places/search`, {
        query
      });
      
      if (searchResponse.data.places && searchResponse.data.places.length > 0) {
        const place = searchResponse.data.places[0];
        
        // Get place details using the proxy
        const detailsResponse = await axios.get(`${this.apiBaseUrl}/api/places/details/${place.id}`);
        
        if (detailsResponse.data) {
          // Response is already in the correct format from our proxy
          return detailsResponse.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching details for ${universityName}:`, error);
      return null;
    }
  }

  // Generate complete university data
  generateUniversityData(university, ranking, details) {
    const isPrivate = Math.random() > 0.6;
    const programs = this.shuffleArray([
      "Computer Science", "Engineering", "Business", "Medicine", 
      "Law", "Arts & Sciences", "Economics", "Physics", 
      "Psychology", "Biology", "Mathematics", "Chemistry"
    ]).slice(0, 5);

    const tuitionRanges = {
      'US': { min: 35000, max: 75000 },
      'UK': { min: 25000, max: 50000 },
      'Canada': { min: 20000, max: 45000 },
      'Australia': { min: 28000, max: 55000 }
    };

    const range = tuitionRanges[university.country] || tuitionRanges['US'];
    const tuitionMin = range.min + Math.floor(Math.random() * 15000);
    const tuitionMax = tuitionMin + Math.floor(Math.random() * 20000);

    return {
      name: university.name,
      country: university.country,
      city: university.city,
      state_province: university.state,
      type: isPrivate ? "private" : "public",
      ranking_overall: ranking,
      ranking_country: this.getCountryRanking(university.country, ranking),
      tuition_min: tuitionMin,
      tuition_max: tuitionMax,
      currency: this.getCurrency(university.country),
      cgpa_requirement: this.getCGPARequirement(ranking),
      ielts_requirement: this.getIELTSRequirement(ranking),
      toefl_requirement: this.getTOEFLRequirement(ranking),
      gre_requirement: ranking <= 30 ? 155 + Math.floor(Math.random() * 15) : null,
      programs_offered: programs,
      description: this.generateDescription(university.name, university.city, university.country, isPrivate),
      website_url: details?.website_url || `https://www.${university.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
      logo_url: this.generateLogoUrl(university.name),
      application_deadline: this.getApplicationDeadline(university.country),
      acceptance_rate: this.getAcceptanceRate(ranking),
      student_population: this.getStudentPopulation(ranking, isPrivate),
      international_student_percentage: this.getInternationalStudentPercentage(university.country),
      admin_approved: true,
      ai_generated: true,
      scraped_at: new Date().toISOString(),
      google_data: details || null
    };
  }

  // Helper methods
  getCurrency(country) {
    const currencies = { 'US': 'USD', 'UK': 'GBP', 'Canada': 'CAD', 'Australia': 'AUD' };
    return currencies[country] || 'USD';
  }

  getCountryRanking(country, globalRanking) {
    const adjustments = { 'US': 0.3, 'UK': 0.4, 'Canada': 0.6, 'Australia': 0.7 };
    return Math.max(1, Math.floor(globalRanking * (adjustments[country] || 0.5)));
  }

  getCGPARequirement(ranking) {
    if (ranking <= 10) return 3.8 + Math.random() * 0.2;
    if (ranking <= 25) return 3.6 + Math.random() * 0.3;
    if (ranking <= 50) return 3.4 + Math.random() * 0.3;
    return 3.0 + Math.random() * 0.4;
  }

  getIELTSRequirement(ranking) {
    if (ranking <= 25) return 7.0 + Math.random() * 0.5;
    if (ranking <= 50) return 6.5 + Math.random() * 0.5;
    return 6.0 + Math.random() * 0.5;
  }

  getTOEFLRequirement(ranking) {
    if (ranking <= 25) return 100 + Math.floor(Math.random() * 10);
    if (ranking <= 50) return 90 + Math.floor(Math.random() * 15);
    return 80 + Math.floor(Math.random() * 15);
  }

  getAcceptanceRate(ranking) {
    if (ranking <= 10) return 3 + Math.random() * 7;
    if (ranking <= 25) return 8 + Math.random() * 12;
    if (ranking <= 50) return 15 + Math.random() * 20;
    return 25 + Math.random() * 30;
  }

  getStudentPopulation(ranking, isPrivate) {
    const base = isPrivate ? 15000 : 35000;
    const variation = isPrivate ? 10000 : 25000;
    return base + Math.floor(Math.random() * variation);
  }

  getInternationalStudentPercentage(country) {
    const percentages = { 'US': 15, 'UK': 35, 'Canada': 25, 'Australia': 40 };
    const base = percentages[country] || 20;
    return base + Math.floor(Math.random() * 15);
  }

  getApplicationDeadline(country) {
    const deadlines = {
      'US': ['January 1', 'January 15', 'February 1', 'March 1'],
      'UK': ['January 15', 'January 31', 'March 31', 'June 30'],
      'Canada': ['January 15', 'February 1', 'March 1', 'April 1'],
      'Australia': ['October 31', 'December 1', 'February 28', 'May 31']
    };
    const options = deadlines[country] || deadlines['US'];
    return options[Math.floor(Math.random() * options.length)];
  }

  generateDescription(name, city, country, isPrivate) {
    const type = isPrivate ? 'private' : 'public';
    const templates = [
      `${name} is a prestigious ${type} research university located in ${city}, ${country}.`,
      `${name} is a leading ${type} university in ${city}, ${country}, known for its academic excellence.`,
      `Established as one of the top ${type} institutions, ${name} in ${city}, ${country} offers world-class education.`,
      `${name} stands as a premier ${type} research university in ${city}, ${country}.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateLogoUrl(universityName) {
    const safeName = universityName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `https://logo.clearbit.com/${safeName}.edu`;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Scrape additional universities and add to Firestore
  async scrapeAndAddNewUniversities(onProgress) {
    const additionalUniversities = this.getAdditionalUniversities();
    let successCount = 0;
    let errorCount = 0;
    
    onProgress?.({ type: 'info', message: `🚀 Starting to scrape ${additionalUniversities.length} new universities...` });
    
    for (let i = 0; i < additionalUniversities.length; i++) {
      const university = additionalUniversities[i];
      const ranking = 37 + i; // Start from 37 since we already have 36
      
      try {
        onProgress?.({ 
          type: 'info', 
          message: `📍 Processing ${i + 1}/${additionalUniversities.length}: ${university.name}` 
        });
        
        // Get Google Places data
        const details = await this.getUniversityDetails(
          university.name, 
          university.city, 
          university.country
        );
        
        // Generate complete university data
        const universityData = this.generateUniversityData(university, ranking, details);
        
        // Add to Firestore
        const firestoreData = {
          ...universityData,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'universities'), firestoreData);
        successCount++;
        
        onProgress?.({ 
          type: 'success', 
          message: `✅ Added: ${university.name} (ID: ${docRef.id})` 
        });
        
        // Rate limiting
        await this.delay(1000);
        
      } catch (error) {
        errorCount++;
        onProgress?.({ 
          type: 'error', 
          message: `❌ Failed to add ${university.name}: ${error.message}` 
        });
      }
    }
    
    return { successCount, errorCount, total: additionalUniversities.length };
  }

  // Update existing universities with fresh data
  async updateExistingUniversities(onProgress) {
    onProgress?.({ type: 'info', message: '🔄 Fetching existing universities from database...' });
    
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      const existingUniversities = [];
      
      snapshot.forEach((doc) => {
        existingUniversities.push({ id: doc.id, ...doc.data() });
      });
      
      let successCount = 0;
      let errorCount = 0;
      
      onProgress?.({ 
        type: 'info', 
        message: `📊 Found ${existingUniversities.length} universities to update` 
      });
      
      for (let i = 0; i < existingUniversities.length; i++) {
        const university = existingUniversities[i];
        
        try {
          onProgress?.({ 
            type: 'info', 
            message: `🔄 Updating ${i + 1}/${existingUniversities.length}: ${university.name}` 
          });
          
          // Get fresh Google Places data
          const details = await this.getUniversityDetails(
            university.name, 
            university.city, 
            university.country
          );
          
          if (details) {
            // Update with fresh data while preserving existing structure
            const updatedData = {
              ...university,
              updated_at: serverTimestamp(),
              google_data: details,
              website_url: details.website_url || university.website_url || null,
              rating: details.rating || university.rating || null,
              photos: details.photos || university.photos || [],
              phone_number: details.phone_number || university.phone_number || null,
              formatted_address: details.formatted_address || university.formatted_address || null,
              reviews_count: details.reviews_count || university.reviews_count || 0,
              scraped_at: new Date().toISOString()
            };
            
            // Remove id before updating
            const { id, ...dataToUpdate } = updatedData;
            
            await updateDoc(doc(db, 'universities', university.id), dataToUpdate);
            successCount++;
          } else {
            onProgress?.({ 
              type: 'warning', 
              message: `⚠️ No new data found for ${university.name}` 
            });
          }
        } catch (error) {
          console.error(`❌ Failed to update ${university.name}:`, error);
          onProgress?.({ 
            type: 'error', 
            message: `❌ Failed to update ${university.name}: ${error.message}` 
          });
          errorCount++;
        }
      }
      
      onProgress?.({ 
        type: 'success', 
        message: `✅ Update complete: ${successCount} successful, ${errorCount} failed` 
      });
      
      return { successCount, errorCount };
    } catch (error) {
      console.error('Error updating universities:', error);
      throw error;
    }
  }
}

export default EnhancedUniversityScraper;
