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
      let universitiesToScrape = [];
      
      if (scrapingOptions.customUniversities) {
        // Parse custom universities list
        const customList = scrapingOptions.customUniversities
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split(',').map(p => p.trim());
            return {
              name: parts[0],
              city: parts[1] || '',
              country: parts[2] || scrapingOptions.country || 'US'
            };
          });
        universitiesToScrape = customList;
      } else {
        // Get predefined universities based on country and count
        const allUniversities = scraper.getAdditionalUniversities();
        universitiesToScrape = scrapingOptions.country 
          ? allUniversities.filter(uni => uni.country === scrapingOptions.country)
          : allUniversities;
        
        universitiesToScrape = universitiesToScrape.slice(0, scrapingOptions.numberOfUniversities);
      }

      await scraper.scrapeUniversities(universitiesToScrape, (progress) => {
        setProgress(progress);
      });
      
      await fetchUniversities();
      showAlert('success', `Successfully scraped ${universitiesToScrape.length} universities`);
    } catch (error) {
      console.error('Error scraping universities:', error);
      showAlert('error', 'Failed to scrape universities');
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

  const filteredUniversities = universities.filter(uni =>
    uni.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </div>

      {progress && (
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
          </div>
        </div>
      )}
    </div>
  );

  const renderUniversitiesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold">Universities Management</h3>
        <FormInput
          placeholder="Search universities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
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
              {filteredUniversities.map((university) => (
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
        
        {filteredUniversities.length === 0 && !loading && (
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
