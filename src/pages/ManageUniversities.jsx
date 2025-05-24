import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Button from '../components/common/Button';
import FormInput from '../components/common/FormInput';
import FormSelect from '../components/common/FormSelect';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import EnhancedUniversityScraper from '../services/enhancedUniversityScraper';

const ManageUniversities = () => {
  const [currentTab, setCurrentTab] = useState('scraping');
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin-specific filters
  const [filters, setFilters] = useState({
    verificationStatus: '',
    country: '',
    ratingFilter: '',
    sortBy: 'name'
  });
  
  const [progress, setProgress] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Scraping options
  const [scrapingOptions, setScrapingOptions] = useState({
    country: '',
    numberOfUniversities: 10,
    customUniversities: ''
  });
  
  const scraper = new EnhancedUniversityScraper();

  const countries = [
    { value: '', label: 'All Countries' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'India', label: 'India' },
    { value: 'China', label: 'China' },
    { value: 'Japan', label: 'Japan' }
  ];

  // Admin filter options
  const verificationStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending Verification' }
  ];

  const ratingFilterOptions = [
    { value: '', label: 'All Ratings' },
    { value: 'hasRating', label: 'Has Rating' },
    { value: 'noRating', label: 'No Rating' },
    { value: 'highRating', label: 'Rating ≥ 4.0' },
    { value: 'lowRating', label: 'Rating < 3.0' }
  ];

  const sortByOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'nameDesc', label: 'Name (Z-A)' },
    { value: 'country', label: 'Country' },
    { value: 'rating', label: 'Rating (High to Low)' },
    { value: 'verifiedAt', label: 'Recently Verified' },
    { value: 'createdAt', label: 'Recently Added' }
  ];

  useEffect(() => {
    fetchUniversities();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'universities'));
      const unis = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUniversities(unis);
    } catch (error) {
      console.error('Error fetching universities:', error);
      showAlert('error', 'Failed to fetch universities');
    }
    setLoading(false);
  };
  const handleScrapUniversities = async () => {
    setLoading(true);
    try {
      // Validate that country is selected
      if (!scrapingOptions.country) {
        showAlert('error', 'Please select a country for university discovery');
        setLoading(false);
        return;
      }

      console.log(`🚀 Starting API-based discovery for ${scrapingOptions.country}`);
      console.log(`📊 Target: ${scrapingOptions.numberOfUniversities} universities`);

      // Use pure API-based discovery
      const results = await scraper.scrapeAndAddNewUniversities(
        (progress) => {
          setProgress(progress);
        }, 
        scrapingOptions.country, 
        scrapingOptions.numberOfUniversities
      );
      
      await fetchUniversities();
      showAlert('success', `Discovery complete! Added: ${results.successCount}, Skipped: ${results.skippedCount} duplicates`);
    } catch (error) {
      console.error('Error in university discovery:', error);
      showAlert('error', 'Failed to discover universities via API');
    }
    setLoading(false);
    setProgress(null);
  };

  const handleUpdateExisting = async () => {
    setLoading(true);
    try {
      await scraper.updateExistingUniversities((progress) => {
        setProgress(progress);
      });
      await fetchUniversities();
      showAlert('success', 'Universities updated successfully');
    } catch (error) {
      console.error('Error updating universities:', error);
      showAlert('error', 'Failed to update universities');
    }
    setLoading(false);
    setProgress(null);
  };

  const handleVerifyUniversity = async (universityId, isVerified) => {
    try {
      await updateDoc(doc(db, 'universities', universityId), {
        isVerified: isVerified,
        verifiedAt: isVerified ? new Date().toISOString() : null
      });
      
      setUniversities(prev => prev.map(uni => 
        uni.id === universityId 
          ? { ...uni, isVerified, verifiedAt: isVerified ? new Date().toISOString() : null }
          : uni
      ));
      
      showAlert('success', `University ${isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      console.error('Error updating verification:', error);
      showAlert('error', 'Failed to update verification status');
    }
  };

  const handleEditUniversity = (university) => {
    setSelectedUniversity({ ...university });
    setEditModal(true);
  };

  const handleSaveUniversity = async () => {
    try {
      const { id, ...updateData } = selectedUniversity;
      await updateDoc(doc(db, 'universities', id), {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      setUniversities(prev => prev.map(uni => 
        uni.id === id ? selectedUniversity : uni
      ));
      
      setEditModal(false);
      showAlert('success', 'University updated successfully');
    } catch (error) {
      console.error('Error updating university:', error);
      showAlert('error', 'Failed to update university');
    }
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearchTerm = 
      uni.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uni.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVerificationStatus = 
      !filters.verificationStatus || 
      (filters.verificationStatus === 'verified' && uni.isVerified) ||
      (filters.verificationStatus === 'pending' && !uni.isVerified);
    
    const matchesCountry = 
      !filters.country || uni.country === filters.country;
    
    const matchesRating = () => {
      if (!filters.ratingFilter) return true;
      if (filters.ratingFilter === 'hasRating') return uni.rating != null;
      if (filters.ratingFilter === 'noRating') return uni.rating == null;
      if (filters.ratingFilter === 'highRating') return uni.rating >= 4.0;
      if (filters.ratingFilter === 'lowRating') return uni.rating < 3.0;
      return true;
    };
    
    return matchesSearchTerm && matchesVerificationStatus && matchesCountry && matchesRating();
  });

  const sortedUniversities = filteredUniversities.sort((a, b) => {
    if (filters.sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (filters.sortBy === 'nameDesc') {
      return b.name.localeCompare(a.name);
    } else if (filters.sortBy === 'country') {
      return a.country.localeCompare(b.country);
    } else if (filters.sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (filters.sortBy === 'verifiedAt') {
      return (b.verifiedAt ? new Date(b.verifiedAt) : 0) - (a.verifiedAt ? new Date(a.verifiedAt) : 0);
    } else if (filters.sortBy === 'createdAt') {
      return (b.createdAt ? new Date(b.createdAt) : 0) - (a.createdAt ? new Date(a.createdAt) : 0);
    }
    return 0;
  });

  const renderScrapingTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Scraping Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormSelect
            label="Country"
            value={scrapingOptions.country}
            onChange={(e) => setScrapingOptions(prev => ({ ...prev, country: e.target.value }))}
            options={countries}
            className="w-full"
          />
          
          <FormInput
            label="Number of Universities"
            type="number"
            value={scrapingOptions.numberOfUniversities}
            onChange={(e) => setScrapingOptions(prev => ({ 
              ...prev, 
              numberOfUniversities: parseInt(e.target.value) || 10 
            }))}
            min="1"
            max="100"
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Universities List (Optional)
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            rows="6"
            placeholder="Enter universities one per line in format: University Name, City, Country"
            value={scrapingOptions.customUniversities}
            onChange={(e) => setScrapingOptions(prev => ({ 
              ...prev, 
              customUniversities: e.target.value 
            }))}
          />
          <p className="text-sm text-gray-500 mt-1">
            Example: Harvard University, Cambridge, US
          </p>
          <p className="text-sm text-gray-500">
            If provided, this will override the country and number settings above.
          </p>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={handleScrapUniversities}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </Button>
          
          <Button
            onClick={handleUpdateExisting}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Updating...' : 'Update Existing Universities'}
          </Button>
        </div>
      </div>      {progress && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Progress</h4>
          <div className="space-y-2">
            <div className={`p-2 rounded text-sm ${
              progress.type === 'success' ? 'bg-green-100 text-green-800' :
              progress.type === 'error' ? 'bg-red-100 text-red-800' :
              progress.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {progress.message}
            </div>
          </div>        </div>
      )}

      {/* Web Scraping Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Web Scraping Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800">Total Universities</h4>
                <p className="text-2xl font-bold text-blue-900">{universities.length}</p>
              </div>
              <div className="text-blue-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">Verified</h4>
                <p className="text-2xl font-bold text-green-900">{universities.filter(u => u.isVerified).length}</p>
              </div>
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-yellow-800">Pending Review</h4>
                <p className="text-2xl font-bold text-yellow-900">{universities.filter(u => !u.isVerified).length}</p>
              </div>
              <div className="text-yellow-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-2">Recent Scraping Activity</h4>
            <div className="space-y-2 text-sm text-purple-700">
              <div className="flex justify-between">
                <span>Last Scraping Session:</span>
                <span className="font-medium">
                  {universities.length > 0 ? 
                    new Date(universities[0]?.created_at?.toDate?.() || universities[0]?.created_at || Date.now()).toLocaleDateString() :
                    'No data'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${loading ? 'text-blue-600' : 'text-green-600'}`}>
                  {loading ? 'In Progress' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-800 mb-2">Data Sources</h4>
            <div className="space-y-1 text-sm text-indigo-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Google Places API</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>University Rankings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Academic Database</span>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 font-medium">Web scraping in progress...</span>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              This process may take several minutes depending on the number of universities being processed.
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderUniversitiesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h3 className="text-lg font-semibold">Universities Management</h3>
        
        {/* Statistics */}
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            Total: {universities.length}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
            Verified: {universities.filter(u => u.isVerified).length}
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Pending: {universities.filter(u => !u.isVerified).length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search Bar */}
          <div className="flex-1 lg:max-w-md">
            <FormInput
              placeholder="Search universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <FormSelect
              label="Verification Status"
              value={filters.verificationStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
              options={verificationStatusOptions}
              className="w-40"
            />
            
            <FormSelect
              label="Country"
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
              options={countries}
              className="w-40"
            />
            
            <FormSelect
              label="Rating Filter"
              value={filters.ratingFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, ratingFilter: e.target.value }))}
              options={ratingFilterOptions}
              className="w-40"
            />
            
            <FormSelect
              label="Sort By"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              options={sortByOptions}
              className="w-48"
            />
          </div>

          {/* Clear Filters Button */}
          <Button
            onClick={() => {
              setFilters({
                verificationStatus: '',
                country: '',
                ratingFilter: '',
                sortBy: 'name'
              });
              setSearchTerm('');
            }}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            Clear All
          </Button>
        </div>
          {/* Results Summary */}
        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
          Showing {sortedUniversities.length} of {universities.length} universities
          {(searchTerm || filters.verificationStatus || filters.country || filters.ratingFilter) && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  University
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUniversities.map((university) => (
                <tr key={university.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {university.name}
                    </div>
                    {university.website_url && (
                      <div className="text-sm text-gray-500">
                        <a 
                          href={university.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {university.website_url}
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {university.city}, {university.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      university.isVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {university.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {university.rating ? `${university.rating}/5` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button
                      onClick={() => handleEditUniversity(university)}
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleVerifyUniversity(university.id, !university.isVerified)}
                      size="sm"
                      className={university.isVerified 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-green-600 hover:bg-green-700'
                      }
                    >
                      {university.isVerified ? 'Unverify' : 'Verify'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedUniversities.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No universities found matching your search.
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !progress) return <LoadingSpinner />;

  return (
    <div className="p-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">University Management</h2>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentTab('scraping')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'scraping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Web Scraping
            </button>
            <button
              onClick={() => setCurrentTab('universities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'universities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Universities
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {currentTab === 'scraping' && renderScrapingTab()}
        {currentTab === 'universities' && renderUniversitiesTab()}
      </div>

      {/* Edit University Modal */}
      {editModal && selectedUniversity && (
        <Modal
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          title="Edit University"
        >
          <div className="space-y-4">
            <FormInput
              label="University Name"
              value={selectedUniversity.name || ''}
              onChange={(e) => setSelectedUniversity(prev => ({ ...prev, name: e.target.value }))}
            />
            <FormInput
              label="City"
              value={selectedUniversity.city || ''}
              onChange={(e) => setSelectedUniversity(prev => ({ ...prev, city: e.target.value }))}
            />
            <FormInput
              label="Country"
              value={selectedUniversity.country || ''}
              onChange={(e) => setSelectedUniversity(prev => ({ ...prev, country: e.target.value }))}
            />
            <FormInput
              label="Website URL"
              value={selectedUniversity.website_url || ''}
              onChange={(e) => setSelectedUniversity(prev => ({ ...prev, website_url: e.target.value }))}
            />
            <FormInput
              label="Rating (1-5)"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={selectedUniversity.rating || ''}
              onChange={(e) => setSelectedUniversity(prev => ({ ...prev, rating: parseFloat(e.target.value) || null }))}
            />
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                onClick={() => setEditModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUniversity}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageUniversities;
