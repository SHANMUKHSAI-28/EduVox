// Enhanced University Scraper for Admin Panel
// Supports adding new universities and updating existing ones with API-based discovery

import axios from 'axios';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

class EnhancedUniversityScraper {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    this.existingUniversities = [];
  }

  // Load existing universities from database to prevent duplicates
  async loadExistingUniversities() {
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      this.existingUniversities = [];
      
      snapshot.forEach((doc) => {
        this.existingUniversities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return this.existingUniversities;
    } catch (error) {
      console.error('Error loading existing universities:', error);
      return [];
    }
  }

  // Check if university already exists in database
  isDuplicateUniversity(universityName, city, country) {
    const normalizedName = universityName.toLowerCase().trim();
    const normalizedCity = city?.toLowerCase().trim() || '';
    const normalizedCountry = country?.toLowerCase().trim() || '';
    
    return this.existingUniversities.some(existing => {
      const existingName = existing.name?.toLowerCase().trim() || '';
      const existingCity = existing.city?.toLowerCase().trim() || '';
      const existingCountry = existing.country?.toLowerCase().trim() || '';
      
      // Check for exact name match
      if (existingName === normalizedName) return true;
      
      // Check for similar names (considering common variations)
      const similarity = this.calculateSimilarity(normalizedName, existingName);
      if (similarity > 0.85 && existingCity === normalizedCity && existingCountry === normalizedCountry) {
        return true;
      }
      
      return false;
    });
  }

  // Calculate string similarity (Levenshtein distance based)
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  // Find duplicates and merge/delete them
  async findAndRemoveDuplicates(onProgress) {
    await this.loadExistingUniversities();
    
    const duplicateGroups = [];
    const processed = new Set();
    
    onProgress?.({ type: 'info', message: '🔍 Scanning for duplicate universities...' });
    
    for (let i = 0; i < this.existingUniversities.length; i++) {
      if (processed.has(i)) continue;
      
      const university = this.existingUniversities[i];
      const duplicates = [i];
      
      for (let j = i + 1; j < this.existingUniversities.length; j++) {
        if (processed.has(j)) continue;
        
        const other = this.existingUniversities[j];
        const similarity = this.calculateSimilarity(
          university.name?.toLowerCase() || '', 
          other.name?.toLowerCase() || ''
        );
        
        if (similarity > 0.85 && 
            university.city?.toLowerCase() === other.city?.toLowerCase() &&
            university.country?.toLowerCase() === other.country?.toLowerCase()) {
          duplicates.push(j);
          processed.add(j);
        }
      }
      
      if (duplicates.length > 1) {
        duplicateGroups.push(duplicates.map(idx => this.existingUniversities[idx]));
      }
      processed.add(i);
    }
    
    let removedCount = 0;
    
    for (const group of duplicateGroups) {
      // Keep the most complete record (with most data)
      const bestRecord = group.reduce((best, current) => {
        const bestScore = this.calculateCompletenessScore(best);
        const currentScore = this.calculateCompletenessScore(current);
        return currentScore > bestScore ? current : best;
      });
      
      // Remove all others
      for (const duplicate of group) {
        if (duplicate.id !== bestRecord.id) {
          try {
            await deleteDoc(doc(db, 'universities', duplicate.id));
            removedCount++;
            onProgress?.({ 
              type: 'warning', 
              message: `🗑️ Removed duplicate: ${duplicate.name} (kept ${bestRecord.name})` 
            });
          } catch (error) {
            onProgress?.({ 
              type: 'error', 
              message: `❌ Failed to remove duplicate ${duplicate.name}: ${error.message}` 
            });
          }
        }
      }
    }
    
    onProgress?.({ 
      type: 'success', 
      message: `✅ Duplicate cleanup complete: ${removedCount} duplicates removed` 
    });
    
    return { duplicateGroups: duplicateGroups.length, removedCount };
  }

  // Calculate completeness score for a university record
  calculateCompletenessScore(university) {
    let score = 0;
    const fields = [
      'name', 'city', 'country', 'website_url', 'description', 'programs_offered',
      'tuition_min', 'tuition_max', 'rating', 'ranking_overall', 'acceptance_rate',
      'student_population', 'photos'
    ];
    
    fields.forEach(field => {
      if (university[field] && university[field] !== null && university[field] !== '') {
        if (Array.isArray(university[field]) && university[field].length > 0) score++;
        else if (!Array.isArray(university[field])) score++;
      }
    });
    
    return score;
  }
  // Search for universities in a specific country using Google Places API
  async searchUniversitiesInCountry(country, maxResults = 50, onProgress) {
    try {
      console.log(`🔍 DEBUG: searchUniversitiesInCountry called with country: ${country}, maxResults: ${maxResults}`);
      onProgress?.({ type: 'info', message: `🌍 Searching for universities in ${country}...` });
      
      const countryQueries = {
        'Germany': ['university Germany', 'universität Deutschland', 'hochschule Deutschland'],
        'France': ['université France', 'university France', 'école France'],
        'US': ['university United States', 'college USA', 'university America'],
        'UK': ['university United Kingdom', 'university England', 'university Scotland'],
        'Canada': ['university Canada', 'université Canada'],
        'Australia': ['university Australia'],
        'India': ['university India', 'college India'],
        'China': ['university China', '大学 中国'],
        'Japan': ['university Japan', '大学 日本']
      };
      
      const queries = countryQueries[country] || [`university ${country}`];
      console.log(`🔍 DEBUG: Using queries for ${country}:`, queries);
      const foundUniversities = [];
      const seenNames = new Set();
      
      for (const query of queries) {
        console.log(`🔍 DEBUG: Processing query: "${query}"`);
        if (foundUniversities.length >= maxResults) {
          console.log(`🔍 DEBUG: Reached maxResults (${maxResults}), breaking from query loop`);
          break;
        }
        
        try {
          onProgress?.({ type: 'info', message: `🔍 Searching with query: "${query}"` });
          console.log(`🔍 DEBUG: Making API call to ${this.apiBaseUrl}/api/places/search`);
          const response = await axios.post(`${this.apiBaseUrl}/api/places/search`, {
            query,
            type: 'university'
          });
          
          console.log(`🔍 DEBUG: API response status: ${response.status}`);
          console.log(`🔍 DEBUG: API response data:`, response.data);
            if (response.data && response.data.places) {
            console.log(`🔍 DEBUG: Found ${response.data.places.length} places in response`);
            for (const place of response.data.places) {
              if (foundUniversities.length >= maxResults) {
                console.log(`🔍 DEBUG: Reached maxResults in place processing loop`);
                break;
              }
              
              const name = place.displayName?.text || place.name || 'Unknown University';
              const normalizedName = name.toLowerCase().trim();
              console.log(`🔍 DEBUG: Processing place: ${name}`);
              
              // Skip if we've already found this university
              if (seenNames.has(normalizedName)) {
                console.log(`🔍 DEBUG: Already seen ${name}, skipping`);
                continue;
              }
              
              // Skip if it doesn't look like a university
              if (!this.isUniversityName(name)) {
                console.log(`🔍 DEBUG: ${name} doesn't look like a university, skipping`);
                continue;
              }
              
              seenNames.add(normalizedName);
              const universityEntry = {
                name: name,
                place_id: place.id,
                formatted_address: place.formattedAddress,
                rating: place.rating,
                types: place.types || []
              };
              foundUniversities.push(universityEntry);
              console.log(`🔍 DEBUG: Added to foundUniversities: ${name} (place_id: ${place.id})`);
              
              onProgress?.({ type: 'info', message: `📍 Found: ${name}` });
            }
          } else {
            console.log(`🔍 DEBUG: No places data in response or response.data.places is empty`);
          }
            // Rate limiting
          console.log(`🔍 DEBUG: Adding 1-second delay before next query...`);
          await this.delay(1000);
          
        } catch (error) {
          console.error(`🔍 DEBUG: Query "${query}" failed with error:`, error);
          onProgress?.({ 
            type: 'warning', 
            message: `⚠️ Query "${query}" failed: ${error.message}` 
          });
        }
      }
      
      console.log(`🔍 DEBUG: Search complete. Total found: ${foundUniversities.length} universities`);
      onProgress?.({ 
        type: 'success', 
        message: `✅ Found ${foundUniversities.length} universities in ${country}` 
      });
      
      return foundUniversities;
        } catch (error) {
      console.error(`🔍 DEBUG: searchUniversitiesInCountry failed with error:`, error);
      onProgress?.({ 
        type: 'error', 
        message: `❌ Failed to search universities in ${country}: ${error.message}` 
      });
      return [];
    }
  }

  // Check if a name looks like a university
  isUniversityName(name) {
    const universityKeywords = [
      'university', 'college', 'institute', 'school',
      'universität', 'université', 'universidad', 'università',
      'hochschule', 'fachhochschule', 'école', 'institut',
      '大学', 'विश्वविद्यालय'
    ];
    
    const lowerName = name.toLowerCase();
    return universityKeywords.some(keyword => lowerName.includes(keyword));  }

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
  }  // Scrape universities from a specific country using API search
  async scrapeUniversitiesByCountry(country, maxResults = 10, onProgress) {
    console.log(`🔍 DEBUG: Starting scrapeUniversitiesByCountry for ${country}, maxResults: ${maxResults}`);
    
    await this.loadExistingUniversities();
    console.log(`🔍 DEBUG: Loaded ${this.existingUniversities.length} existing universities`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    onProgress?.({ 
      type: 'info', 
      message: `🚀 Starting intelligent scraping for ${country} (max ${maxResults} universities)...` 
    });
    
    // First, find and remove any existing duplicates
    console.log(`🔍 DEBUG: Starting duplicate removal...`);
    await this.findAndRemoveDuplicates(onProgress);
    
    // Reload existing universities after duplicate cleanup
    await this.loadExistingUniversities();
    console.log(`🔍 DEBUG: After duplicate cleanup, have ${this.existingUniversities.length} universities`);
    
    // Search for universities in the specified country
    console.log(`🔍 DEBUG: Starting university search for ${country}...`);
    const foundUniversities = await this.searchUniversitiesInCountry(country, maxResults * 3, onProgress);
    console.log(`🔍 DEBUG: Found ${foundUniversities.length} universities from API`);
      if (foundUniversities.length === 0) {
      console.log(`🔍 DEBUG: No universities found for ${country}`);
      onProgress?.({ 
        type: 'warning', 
        message: `⚠️ No universities found in ${country}` 
      });
      return { successCount: 0, errorCount: 0, skippedCount: 0, total: 0 };
    }
    
    console.log(`🔍 DEBUG: Starting to process ${foundUniversities.length} found universities`);
    let processedCount = 0;
    
    for (const university of foundUniversities) {
      console.log(`🔍 DEBUG: Processing university ${processedCount + 1}/${foundUniversities.length}: ${university.name}`);
      if (successCount >= maxResults) {
        console.log(`🔍 DEBUG: Reached maxResults limit (${maxResults}), stopping`);
        break;
      }
        try {
        processedCount++;
        console.log(`🔍 DEBUG: Processing university ${processedCount}: ${university.name}`);
        onProgress?.({ 
          type: 'info', 
          message: `📍 Processing ${processedCount}/${foundUniversities.length}: ${university.name}` 
        });
        
        // Extract city and country from address
        console.log(`🔍 DEBUG: Extracting location from: ${university.formatted_address}`);
        const locationInfo = this.extractLocationInfo(university.formatted_address, country);
        console.log(`🔍 DEBUG: Extracted location:`, locationInfo);
        
        // Check if university already exists
        console.log(`🔍 DEBUG: Checking for duplicates: ${university.name}, ${locationInfo.city}, ${country}`);
        if (this.isDuplicateUniversity(university.name, locationInfo.city, country)) {
          console.log(`🔍 DEBUG: Found duplicate, skipping: ${university.name}`);
          skippedCount++;
          onProgress?.({ 
            type: 'warning', 
            message: `⏭️ Skipped duplicate: ${university.name}` 
          });
          continue;
        }
        
        console.log(`🔍 DEBUG: Getting detailed info for place_id: ${university.place_id}`);
        // Get detailed information
        const details = await this.getUniversityDetailsByPlaceId(university.place_id);
        console.log(`🔍 DEBUG: Got details:`, details ? 'Yes' : 'No');
          // Generate ranking (based on order found + rating)
        const ranking = processedCount + Math.floor((5 - (university.rating || 3)) * 10);
        console.log(`🔍 DEBUG: Generated ranking: ${ranking}`);
        
        // Generate complete university data
        console.log(`🔍 DEBUG: Generating university data...`);
        const universityData = this.generateUniversityData({
          name: university.name,
          city: locationInfo.city,
          country: country,
          state: locationInfo.state
        }, ranking, details);
        console.log(`🔍 DEBUG: Generated university data for: ${universityData.name}`);
        
        // Add to Firestore
        console.log(`🔍 DEBUG: Adding to Firestore...`);
        const firestoreData = {
          ...universityData,
          place_id: university.place_id,
          discovered_via_api: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        };
        
        console.log(`🔍 DEBUG: Firestore data prepared, calling addDoc...`);
        const docRef = await addDoc(collection(db, 'universities'), firestoreData);
        console.log(`🔍 DEBUG: Successfully added to Firestore with ID: ${docRef.id}`);
        successCount++;
        
        // Update our local cache
        this.existingUniversities.push({
          id: docRef.id,
          ...universityData
        });
        
        onProgress?.({ 
          type: 'success', 
          message: `✅ Added: ${university.name} (ID: ${docRef.id})` 
        });
        
        // Rate limiting
        console.log(`🔍 DEBUG: Adding delay before next university...`);
        await this.delay(2000);
          } catch (error) {
        console.error(`🔍 DEBUG: Error processing ${university.name}:`, error);
        errorCount++;
        onProgress?.({ 
          type: 'error', 
          message: `❌ Failed to add ${university.name}: ${error.message}` 
        });
      }
    }
    
    console.log(`🔍 DEBUG: Processing complete. Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    onProgress?.({ 
      type: 'success', 
      message: `🎉 Scraping complete: ${successCount} added, ${skippedCount} skipped (duplicates), ${errorCount} failed` 
    });
    
    return { successCount, errorCount, skippedCount, total: foundUniversities.length };
  }
  // Main method for API-based university scraping by country
  async scrapeAndAddNewUniversities(onProgress, country = null, numberOfUniversities = 10) {
    try {
      onProgress?.({ 
        type: 'info', 
        message: '🚀 Starting API-based university discovery...' 
      });

      // Load existing universities to prevent duplicates
      await this.loadExistingUniversities();
      
      if (!country) {
        onProgress?.({ 
          type: 'error', 
          message: '❌ No country specified for university discovery' 
        });
        return { successCount: 0, errorCount: 1, skippedCount: 0 };
      }
      
      onProgress?.({ 
        type: 'info', 
        message: `🌍 Discovering ${numberOfUniversities} universities in ${country} using Google Places API...` 
      });
      
      // Use API-based discovery for the specified country
      const results = await this.scrapeUniversitiesByCountry(
        country, 
        numberOfUniversities,
        onProgress
      );
      
      onProgress?.({ 
        type: 'success', 
        message: `🎉 Discovery complete! Added: ${results.successCount}, Skipped: ${results.skippedCount}, Errors: ${results.errorCount}` 
      });
      
      return results;
      
    } catch (error) {
      console.error('Error in API-based university discovery:', error);
      onProgress?.({ 
        type: 'error', 
        message: `❌ University discovery failed: ${error.message}` 
      });
      throw error;
    }
  }

  // Extract city and state from formatted address
  extractLocationInfo(formattedAddress, country) {
    if (!formattedAddress) return { city: '', state: '' };
    
    const parts = formattedAddress.split(',').map(part => part.trim());
    
    // Country-specific parsing
    switch (country) {
      case 'Germany':
        // Format: "Street, PLZ City, Germany"
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (/^\d{5}\s+/.test(part)) { // German postal code pattern
            return {
              city: part.replace(/^\d{5}\s+/, ''),
              state: parts[i + 1] === 'Germany' ? (parts[i - 1] || '') : (parts[i + 1] || '')
            };
          }
        }
        break;
        
      case 'France':
        // Format: "Street, PLZ City, France"
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (/^\d{5}\s+/.test(part)) { // French postal code pattern
            return {
              city: part.replace(/^\d{5}\s+/, ''),
              state: parts[i + 1] === 'France' ? (parts[i - 1] || '') : (parts[i + 1] || '')
            };
          }
        }
        break;
        
      default:
        // Generic parsing
        if (parts.length >= 2) {
          return {
            city: parts[parts.length - 3] || parts[parts.length - 2] || '',
            state: parts[parts.length - 2] || ''
          };
        }
    }
    
    return { city: parts[0] || '', state: parts[1] || '' };
  }
  // Get detailed university information by place ID
  async getUniversityDetailsByPlaceId(placeId) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/places/details/${placeId}`);
      
      if (response.data) {
        // Handle both new API v1 format and legacy format
        const details = response.data;
        return {
          website_url: details.websiteUri || details.website_url || null,
          formatted_address: details.formattedAddress || details.formatted_address || null,
          phone_number: details.phoneNumber || details.phone_number || null,
          rating: details.rating || null,
          photos: details.photos ? details.photos.slice(0, 3).map(photo => 
            photo.name || `${this.apiBaseUrl}/api/places/photo?photo_reference=${photo.photo_reference}&maxwidth=400`
          ) : [],
          reviews_count: details.reviews_count || (details.reviews ? details.reviews.length : 0),
          opening_hours: details.opening_hours || null
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching details for place ID ${placeId}:`, error.message);
      return null;
    }
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
