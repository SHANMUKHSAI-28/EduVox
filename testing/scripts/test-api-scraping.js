// Test API-based University Scraping System
// This script tests the new pure API-based university discovery

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

class UniversityScrapingTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async runTests() {
    console.log('🧪 Starting University API Scraping Tests...\n');
    
    await this.testAPIConnection();
    await this.testGermanUniversitySearch();
    await this.testFranceUniversitySearch();
    await this.testUSUniversitySearch();
    
    this.printResults();
  }

  async testAPIConnection() {
    try {
      console.log('🔌 Testing API Server Connection...');
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      if (response.status === 200) {
        this.logSuccess('API Connection', 'Server is responsive');
      } else {
        this.logFailure('API Connection', 'Unexpected response status');
      }
    } catch (error) {
      this.logFailure('API Connection', `Server unreachable: ${error.message}`);
    }
  }

  async testGermanUniversitySearch() {
    try {
      console.log('🇩🇪 Testing German University Search...');
      
      const response = await axios.post(`${API_BASE_URL}/api/places/search`, {
        query: 'university Germany',
        type: 'university'
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const germanUniversities = response.data.results.filter(uni => 
          uni.name.toLowerCase().includes('universität') || 
          uni.name.toLowerCase().includes('university') ||
          uni.name.toLowerCase().includes('hochschule')
        );
        
        if (germanUniversities.length > 0) {
          this.logSuccess('German University Search', `Found ${germanUniversities.length} German universities`);
          console.log('   Sample:', germanUniversities.slice(0, 3).map(u => u.name));
        } else {
          this.logFailure('German University Search', 'No German universities found');
        }
      } else {
        this.logFailure('German University Search', 'No results returned from API');
      }
    } catch (error) {
      this.logFailure('German University Search', `API Error: ${error.message}`);
    }
  }

  async testFranceUniversitySearch() {
    try {
      console.log('🇫🇷 Testing French University Search...');
      
      const response = await axios.post(`${API_BASE_URL}/api/places/search`, {
        query: 'université France',
        type: 'university'
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const frenchUniversities = response.data.results.filter(uni => 
          uni.name.toLowerCase().includes('université') || 
          uni.name.toLowerCase().includes('university') ||
          uni.name.toLowerCase().includes('école')
        );
        
        if (frenchUniversities.length > 0) {
          this.logSuccess('French University Search', `Found ${frenchUniversities.length} French universities`);
          console.log('   Sample:', frenchUniversities.slice(0, 3).map(u => u.name));
        } else {
          this.logFailure('French University Search', 'No French universities found');
        }
      } else {
        this.logFailure('French University Search', 'No results returned from API');
      }
    } catch (error) {
      this.logFailure('French University Search', `API Error: ${error.message}`);
    }
  }

  async testUSUniversitySearch() {
    try {
      console.log('🇺🇸 Testing US University Search...');
      
      const response = await axios.post(`${API_BASE_URL}/api/places/search`, {
        query: 'university United States',
        type: 'university'
      });
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const usUniversities = response.data.results.filter(uni => 
          uni.name.toLowerCase().includes('university') || 
          uni.name.toLowerCase().includes('college')
        );
        
        if (usUniversities.length > 0) {
          this.logSuccess('US University Search', `Found ${usUniversities.length} US universities`);
          console.log('   Sample:', usUniversities.slice(0, 3).map(u => u.name));
        } else {
          this.logFailure('US University Search', 'No US universities found');
        }
      } else {
        this.logFailure('US University Search', 'No results returned from API');
      }
    } catch (error) {
      this.logFailure('US University Search', `API Error: ${error.message}`);
    }
  }

  logSuccess(testName, message) {
    this.testResults.passed++;
    this.testResults.details.push({ test: testName, status: 'PASS', message });
    console.log(`   ✅ ${testName}: ${message}`);
  }

  logFailure(testName, message) {
    this.testResults.failed++;
    this.testResults.details.push({ test: testName, status: 'FAIL', message });
    console.log(`   ❌ ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.details
        .filter(result => result.status === 'FAIL')
        .forEach(result => console.log(`   • ${result.test}: ${result.message}`));
    }
    
    console.log('\n🎉 API-based university discovery testing complete!');
  }
}

// Run the tests
const tester = new UniversityScrapingTest();
tester.runTests().catch(console.error);
