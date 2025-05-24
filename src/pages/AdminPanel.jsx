import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Import scraped university data
import scrapedUniversities from '../../data/scraped-universities.json';
// Import enhanced scraper service
import EnhancedUniversityScraper from '../services/enhancedUniversityScraper.js';

// University data for quick population
const sampleUniversities = [
  {
    name: "Harvard University",
    country: "US",
    city: "Cambridge",
    state_province: "Massachusetts",
    type: "private",
    ranking_overall: 1,
    ranking_country: 1,
    tuition_min: 54000,
    tuition_max: 54000,
    currency: "USD",
    cgpa_requirement: 3.9,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    gre_requirement: 165,
    programs_offered: ["Computer Science", "Medicine", "Law", "Business", "Engineering"],
    description: "Harvard University is a private Ivy League research university in Cambridge, Massachusetts.",
    website_url: "https://www.harvard.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Harvard-Symbol.png",
    application_deadline: "January 1",
    acceptance_rate: 3.4,
    student_population: 23000,
    international_student_percentage: 25,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "Stanford University",
    country: "US",
    city: "Stanford",
    state_province: "California",
    type: "private",
    ranking_overall: 2,
    ranking_country: 2,
    tuition_min: 56169,
    tuition_max: 56169,
    currency: "USD",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    gre_requirement: 165,
    programs_offered: ["Computer Science", "Engineering", "Business", "Medicine"],
    description: "Stanford University is a private research university in Stanford, California.",
    website_url: "https://www.stanford.edu",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Stanford-University-Logo.png",
    application_deadline: "January 2",
    acceptance_rate: 3.9,
    student_population: 17000,
    international_student_percentage: 23,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Oxford",
    country: "UK",
    city: "Oxford",
    state_province: "England",
    type: "public",
    ranking_overall: 4,
    ranking_country: 1,
    tuition_min: 30000,
    tuition_max: 45000,
    currency: "GBP",
    cgpa_requirement: 3.8,
    ielts_requirement: 7.0,
    toefl_requirement: 100,
    gre_requirement: null,
    programs_offered: ["Medicine", "Law", "Philosophy", "History", "Engineering"],
    description: "The University of Oxford is the oldest university in the English-speaking world.",
    website_url: "https://www.ox.ac.uk",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/Oxford-University-Logo.png",
    application_deadline: "October 15",
    acceptance_rate: 17.5,
    student_population: 24000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    state_province: "Ontario",
    type: "public",
    ranking_overall: 21,
    ranking_country: 1,
    tuition_min: 25000,
    tuition_max: 35000,
    currency: "CAD",
    cgpa_requirement: 3.7,
    ielts_requirement: 6.5,
    toefl_requirement: 89,
    gre_requirement: null,
    programs_offered: ["Engineering", "Medicine", "Business", "Arts & Sciences"],
    description: "The University of Toronto is a public research university and one of the most prestigious universities in Canada.",
    website_url: "https://www.utoronto.ca",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/University-of-Toronto-Logo.png",
    application_deadline: "January 13",
    acceptance_rate: 43.0,
    student_population: 97000,
    international_student_percentage: 25,
    admin_approved: true,
    ai_generated: true
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    state_province: "Victoria",
    type: "public",
    ranking_overall: 33,
    ranking_country: 2,
    tuition_min: 30000,
    tuition_max: 40000,
    currency: "AUD",
    cgpa_requirement: 3.4,
    ielts_requirement: 6.5,
    toefl_requirement: 79,
    gre_requirement: null,
    programs_offered: ["Medicine", "Engineering", "Arts", "Sciences", "Business"],
    description: "The University of Melbourne is a public research university located in Melbourne, Victoria.",
    website_url: "https://www.unimelb.edu.au",
    logo_url: "https://logos-world.net/wp-content/uploads/2021/09/University-of-Melbourne-Logo.png",
    application_deadline: "October 31",
    acceptance_rate: 70.0,
    student_population: 50000,
    international_student_percentage: 45,
    admin_approved: true,
    ai_generated: true
  }
];

const AdminPanel = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState([]);
  const [isScrapingNew, setIsScrapingNew] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user is admin
  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">Access Denied</h2>
          <p className="text-secondary-600 mb-6">
            You need admin privileges to access this panel.
          </p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  const populateUniversities = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      const errors = [];
      
      for (const university of sampleUniversities) {
        try {
          const universityData = {
            ...university,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const docRef = await addDoc(collection(db, 'universities'), universityData);
          console.log(`✅ Added: ${university.name} (ID: ${docRef.id})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to add ${university.name}:`, error);
          errors.push({ university: university.name, error: error.message });
        }
      }
      
      setAlert({ 
        type: 'success', 
        message: `Successfully added ${successCount}/${sampleUniversities.length} universities!` 
      });
      
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
      
      // Refresh the universities list
      await loadUniversities();
      
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to populate universities: ' + error.message });
    } finally {
      setLoading(false);
    }
  };
  const populateScrapedUniversities = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      const errors = [];
      
      for (const university of scrapedUniversities) {
        try {
          const universityData = {
            ...university,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            // Ensure all required fields are present
            programs_offered: university.programs_offered || [],
            admin_approved: university.admin_approved || true,
            ai_generated: university.ai_generated || true
          };
          
          // Remove any undefined values
          Object.keys(universityData).forEach(key => {
            if (universityData[key] === undefined || universityData[key] === null) {
              delete universityData[key];
            }
          });
          
          const docRef = await addDoc(collection(db, 'universities'), universityData);
          console.log(`✅ Added: ${university.name} (ID: ${docRef.id})`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to add ${university.name}:`, error);
          errors.push({ university: university.name, error: error.message });
        }
      }
      
      setAlert({ 
        type: 'success', 
        message: `Successfully added ${successCount}/${scrapedUniversities.length} scraped universities!` 
      });
      
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }
      
      // Refresh the universities list
      await loadUniversities();
      
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to populate scraped universities: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const scrapeAdditionalUniversities = async () => {
    setIsScrapingNew(true);
    setScrapingProgress([]);
    
    try {
      const scraper = new EnhancedUniversityScraper();
      
      const result = await scraper.scrapeAndAddNewUniversities((progressData) => {
        setScrapingProgress(prev => [...prev, progressData]);
      });
      
      setAlert({ 
        type: 'success', 
        message: `🎉 Successfully added ${result.successCount}/${result.total} new universities! (${result.errorCount} errors)` 
      });
      
      // Refresh the universities list
      await loadUniversities();
      
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to scrape additional universities: ' + error.message });
    } finally {
      setIsScrapingNew(false);
    }
  };

  const updateExistingUniversities = async () => {
    setIsUpdating(true);
    setScrapingProgress([]);
    
    try {
      const scraper = new EnhancedUniversityScraper();
      
      const result = await scraper.updateExistingUniversities((progressData) => {
        setScrapingProgress(prev => [...prev, progressData]);
      });
      
      setAlert({ 
        type: 'success', 
        message: `🔄 Successfully updated ${result.successCount}/${result.total} universities! (${result.errorCount} errors)` 
      });
      
      // Refresh the universities list
      await loadUniversities();
      
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update universities: ' + error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const loadUniversities = async () => {
    setLoadingData(true);
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      const universitiesList = [];
      
      snapshot.forEach((doc) => {
        universitiesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUniversities(universitiesList);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load universities: ' + error.message });
    } finally {
      setLoadingData(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to delete ALL universities? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      const deletePromises = [];
      
      snapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'universities', document.id)));
      });
      
      await Promise.all(deletePromises);
      
      setAlert({ type: 'success', message: `Deleted ${snapshot.size} universities successfully!` });
      setUniversities([]);
      
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to clear database: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="glass-card rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary mb-2">Admin Panel</h1>
              <p className="text-secondary-600">Manage university database and system settings</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-success-600">Admin Access</span>
            </div>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="mb-6">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* Database Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Population Panel */}
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Database Population</h3>
                <p className="text-secondary-600">Add sample universities to the database</p>
              </div>
            </div>            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <h4 className="font-semibold text-primary-800 mb-2">Sample Data Includes:</h4>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• 5 top universities from US, UK, Canada, Australia</li>
                  <li>• Complete academic requirements and tuition data</li>
                  <li>• Programs offered and acceptance rates</li>
                  <li>• Validated data structure for testing</li>
                </ul>
              </div>

              <div className="bg-success-50 border border-success-200 rounded-xl p-4">
                <h4 className="font-semibold text-success-800 mb-2">🎓 Real Scraped Data Available:</h4>
                <ul className="text-sm text-success-700 space-y-1">
                  <li>• 36 top universities with Google API data</li>
                  <li>• Real websites, addresses, and ratings</li>
                  <li>• Comprehensive ranking and tuition info</li>
                  <li>• Generated from Harvard, MIT, Oxford, Stanford & more</li>
                </ul>
              </div>

              <Button
                variant="gradient"
                size="lg"
                onClick={populateUniversities}
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                {loading ? 'Adding Universities...' : 'Populate Sample Universities (5)'}
              </Button>              <Button
                variant="primary"
                size="lg"
                onClick={populateScrapedUniversities}
                disabled={loading || isScrapingNew || isUpdating}
                loading={loading}
                className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700"
              >
                {loading ? 'Adding Scraped Data...' : '🚀 Populate Scraped Universities (36)'}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🔥 Live Scraping Available:</h4>
                <ul className="text-sm text-blue-700 space-y-1 mb-3">
                  <li>• Add 36 more universities with Google API data</li>
                  <li>• Update existing universities with fresh information</li>
                  <li>• Real-time progress tracking</li>
                </ul>
                
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={scrapeAdditionalUniversities}
                    disabled={loading || isScrapingNew || isUpdating}
                    loading={isScrapingNew}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    {isScrapingNew ? 'Scraping New Universities...' : '🌟 Add More Universities (36)'}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={updateExistingUniversities}
                    disabled={loading || isScrapingNew || isUpdating}
                    loading={isUpdating}
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    {isUpdating ? 'Updating Universities...' : '🔄 Update Existing Universities'}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={loadUniversities}
                disabled={loadingData}
                loading={loadingData}
                className="w-full border-secondary-300"
              >
                {loadingData ? 'Loading...' : 'Refresh Universities List'}
              </Button>
            </div>
          </div>

          {/* Database Status */}
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">Database Status</h3>
                <p className="text-secondary-600">Current database statistics</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-secondary-800">Total Universities</span>
                  <span className="text-2xl font-bold text-primary-600">{universities.length}</span>
                </div>

                {universities.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">US Universities:</span>
                      <span className="font-medium">{universities.filter(u => u.country === 'US').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">UK Universities:</span>
                      <span className="font-medium">{universities.filter(u => u.country === 'UK').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Canadian Universities:</span>
                      <span className="font-medium">{universities.filter(u => u.country === 'Canada').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Australian Universities:</span>
                      <span className="font-medium">{universities.filter(u => u.country === 'Australia').length}</span>
                    </div>
                  </div>
                )}
              </div>

              {universities.length > 0 && (
                <Button
                  variant="danger"
                  size="lg"
                  onClick={clearDatabase}
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                >
                  {loading ? 'Clearing...' : 'Clear All Universities'}
                </Button>
              )}
            </div>          </div>
        </div>

        {/* Scraping Progress */}
        {(isScrapingNew || isUpdating || scrapingProgress.length > 0) && (
          <div className="mt-8 glass-card rounded-3xl p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-secondary-900">
                  {isScrapingNew ? 'Adding New Universities' : isUpdating ? 'Updating Universities' : 'Scraping Progress'}
                </h3>
                <p className="text-secondary-600">Real-time progress updates</p>
              </div>
            </div>

            <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 max-h-64 overflow-y-auto">
              {scrapingProgress.length === 0 ? (
                <div className="text-center text-secondary-500 py-4">
                  <div className="animate-pulse">Initializing scraper...</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {scrapingProgress.slice(-20).map((progress, index) => (
                    <div key={index} className={`text-sm flex items-center space-x-2 ${
                      progress.type === 'success' ? 'text-success-700' :
                      progress.type === 'error' ? 'text-danger-700' :
                      'text-secondary-700'
                    }`}>
                      <span className="text-xs text-secondary-400">
                        {new Date().toLocaleTimeString()}
                      </span>
                      <span>{progress.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Universities List */}
        {universities.length > 0 && (
          <div className="mt-8 glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold text-secondary-900 mb-6">Current Universities</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800">Country</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800">Ranking</th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {universities.slice(0, 10).map((university) => (
                    <tr key={university.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {university.logo_url && (
                            <img
                              src={university.logo_url}
                              alt={`${university.name} logo`}
                              className="w-8 h-8 rounded-lg mr-3 object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-secondary-900">{university.name}</div>
                            <div className="text-sm text-secondary-600">{university.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-secondary-700">{university.country}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          university.type === 'private' 
                            ? 'bg-accent-100 text-accent-700' 
                            : 'bg-primary-100 text-primary-700'
                        }`}>
                          {university.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-secondary-700">
                        {university.ranking_overall ? `#${university.ranking_overall}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="status-success">
                          {university.admin_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {universities.length > 10 && (
                <div className="mt-4 text-center text-secondary-600">
                  And {universities.length - 10} more universities...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
