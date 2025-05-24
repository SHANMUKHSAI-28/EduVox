import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import UniversityCard from '../components/university/UniversityCard';
import UniversityFilters from '../components/university/UniversityFilters';
import UniversityComparison from '../components/university/UniversityComparisonEnhanced';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdBanner from '../components/ads/AdBanner';
import AdContainer from '../components/ads/AdContainer';
import { 
  universityService, 
  academicProfileService, 
  savedUniversitiesService, 
  matchingService 
} from '../services/universityService';
import { exportUniversitiesPDF } from '../utils/pdfExport';

const Universities = () => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // discover, saved
  const [academicProfile, setAcademicProfile] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [comparisonUniversities, setComparisonUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({});
  const [showComparison, setShowComparison] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  useEffect(() => {
    loadAcademicProfile();
    loadSavedUniversities();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'discover') {
      loadUniversities();
    }
  }, [activeTab, filters, academicProfile]);

  const loadAcademicProfile = async () => {
    if (!currentUser) return;

    try {
      const profile = await academicProfileService.getAcademicProfile(currentUser.uid);
      setAcademicProfile(profile);
    } catch (error) {
      console.error('Error loading academic profile:', error);
    }
  };
  const loadUniversities = async (append = false) => {
    setLoading(true);
    try {
      let result;
        // Always use universityService.getUniversities for consistency
      // Only apply academic profile matching if no manual filters are set
      if (academicProfile && Object.keys(filters).length === 0) {
        // Get matched universities based on academic profile
        try {
          const matchedUniversities = await matchingService.getMatchedUniversities(academicProfile, {});
            // If no matches found, fallback to showing all verified universities
          if (matchedUniversities.length === 0) {
            const fallbackResult = await universityService.getUniversities({ showUnverified: false }, 20, null, false);
            result = fallbackResult;
          } else {
            result = { 
              universities: matchedUniversities,
              hasMore: false,
              lastDoc: null
            };
          }        } catch (error) {
          // Fallback to showing all universities
          result = await universityService.getUniversities({ showUnverified: false }, 20, null, false);
        }
      } else {
        // Get filtered universities - always show verified ones for students
        const filterParams = {
          ...filters,
          showUnverified: false // Students should only see verified universities
        };
        result = await universityService.getUniversities(filterParams, 20, append ? lastDoc : null, false);
      }

      if (append) {
        setUniversities(prev => [...prev, ...result.universities]);
      } else {
        setUniversities(result.universities);
      }
      
      setHasMore(result.hasMore || false);
      setLastDoc(result.lastDoc || null);
    } catch (error) {
      console.error('Error loading universities:', error);
      setAlert({ type: 'error', message: 'Failed to load universities' });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedUniversities = async () => {
    if (!currentUser) return;

    try {
      const saved = await savedUniversitiesService.getSavedUniversities(currentUser.uid);
      setSavedUniversities(saved);
    } catch (error) {
      console.error('Error loading saved universities:', error);
    }
  };

  const handleProfileSave = (profileData) => {
    setAcademicProfile(profileData);
    setAlert({ type: 'success', message: 'Profile updated! Discovering matching universities...' });
    setActiveTab('discover');
    setTimeout(() => setAlert(null), 3000);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setLastDoc(null);
  };

  const handleSaveUniversity = (university) => {
    setSavedUniversities(prev => [university, ...prev]);
    setAlert({ type: 'success', message: `${university.name} saved to your list!` });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleRemoveSavedUniversity = (universityId) => {
    setSavedUniversities(prev => prev.filter(uni => uni.id !== universityId));
  };
  const handleCompareUniversity = (university) => {
    if (comparisonUniversities.length >= 10) {
      setAlert({ type: 'warning', message: 'You can compare up to 10 universities at once.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    if (comparisonUniversities.find(uni => uni.id === university.id)) {
      setAlert({ type: 'warning', message: 'University is already in comparison.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    setComparisonUniversities(prev => [...prev, university]);
    setAlert({ type: 'success', message: `${university.name} added to comparison (${comparisonUniversities.length + 1}/10)` });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleRemoveFromComparison = (universityId) => {
    setComparisonUniversities(prev => prev.filter(uni => uni.id !== universityId));
  };

  const handleExportPDF = () => {
    if (savedUniversities.length === 0) {
      setAlert({ type: 'warning', message: 'No universities to export. Save some universities first.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      exportUniversitiesPDF(savedUniversities, academicProfile, currentUser?.email);
      setAlert({ type: 'success', message: 'PDF exported successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setAlert({ type: 'error', message: 'Failed to export PDF. Please try again.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const loadMoreUniversities = () => {
    if (hasMore && !loading) {
      loadUniversities(true);
    }
  };
  const tabs = [
    { 
      id: 'discover', 
      name: 'Discover Universities', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    { 
      id: 'saved', 
      name: `Saved Universities (${savedUniversities.length})`, 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden rounded-xl p-2 text-secondary-400 hover:text-secondary-600 hover:bg-white/50 transition-all duration-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="ml-4 lg:ml-0 text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  University Shortlisting
                </h1>
              </div>

              {/* Comparison Button */}
              {comparisonUniversities.length > 0 && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  className="relative"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare ({comparisonUniversities.length})
                </Button>
              )}
            </div>
          </div>
        </div>        {/* Tabs */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-white/20">
          <div className="px-3 sm:px-4 lg:px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>        {/* Alert */}
        {alert && (
          <div className="px-3 sm:px-4 lg:px-6 py-4">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              {activeTab === 'discover' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Filters Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-6">
                      <UniversityFilters 
                        onFiltersChange={handleFiltersChange}
                        loading={loading}
                      />
                    </div>
                  </div>

                  {/* Universities Grid */}
                  <div className="lg:col-span-3">
                    {!academicProfile && (
                      <div className="mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-3xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary-100 rounded-2xl">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-primary-900">Complete Your Academic Profile</h3>
                            <p className="text-primary-700 text-sm">Get personalized university recommendations by completing your academic profile.</p>
                          </div>                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => window.location.href = '/profile'}
                          >
                            Complete Profile
                          </Button>
                        </div>
                      </div>
                    )}

                    {loading && universities.length === 0 ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                      </div>
                    ) : universities.length === 0 ? (
                      <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20">
                        <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-secondary-900">No Universities Found</h3>
                        <p className="mt-1 text-sm text-secondary-500">
                          Try adjusting your filters or search terms.
                        </p>
                      </div>                    ) : (                      <>
                        {/* AdSense Banner at Top */}
                        <div className="mb-6">
                          <AdBanner 
                            slot={import.meta.env.VITE_ADSENSE_BANNER_SLOT}
                            size="large" 
                            format="horizontal"
                          />
                        </div>

                        <AdContainer 
                          adSlots={[
                            import.meta.env.VITE_ADSENSE_ARTICLE_SLOT,
                            import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT
                          ]}
                          adFrequency={4} 
                          adSize="medium"
                          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                        >
                          {universities.map((university) => {
                            const isSaved = savedUniversities.some(saved => saved.id === university.id);
                            return (
                              <UniversityCard
                                key={university.id}
                                university={university}
                                match={university.match}
                                isSaved={isSaved}
                                onSave={handleSaveUniversity}
                                onRemove={handleRemoveSavedUniversity}
                                onCompare={handleCompareUniversity}
                                showMatch={true}
                              />
                            );
                          })}
                        </AdContainer>

                        {/* Load More Button */}
                        {hasMore && (
                          <div className="text-center">
                            <Button
                              variant="outline"
                              onClick={loadMoreUniversities}
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Loading...
                                </>
                              ) : (
                                'Load More Universities'
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'saved' && (
                <div>
                  {savedUniversities.length === 0 ? (
                    <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20">
                      <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-secondary-900">No Saved Universities</h3>
                      <p className="mt-1 text-sm text-secondary-500">
                        Start discovering universities and save the ones you're interested in.
                      </p>
                      <div className="mt-6">
                        <Button
                          variant="primary"
                          onClick={() => setActiveTab('discover')}
                        >
                          Discover Universities
                        </Button>
                      </div>
                    </div>                  ) : (
                    <div>
                      {/* Export Button */}
                      <div className="mb-6 flex justify-between items-center bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-900">Your Shortlist</h3>
                          <p className="text-sm text-secondary-600">{savedUniversities.length} universities saved</p>
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleExportPDF}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export PDF
                        </Button>                      </div>                      
                      {/* AdSense Banner for Saved Universities */}
                      <div className="mb-6">
                        <AdBanner 
                          slot={import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT}
                          size="large" 
                          format="horizontal"
                        />
                      </div>

                      {/* Universities Grid with AdSense */}
                      <AdContainer 
                        adSlots={[import.meta.env.VITE_ADSENSE_ARTICLE_SLOT]}
                        adFrequency={5} 
                        adSize="medium"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {savedUniversities.map((university) => (
                          <UniversityCard
                            key={university.id}
                            university={university}
                            isSaved={true}
                            onRemove={handleRemoveSavedUniversity}
                            onCompare={handleCompareUniversity}
                            showMatch={false}
                          />
                        ))}
                      </AdContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* University Comparison Modal */}
      <UniversityComparison
        universities={comparisonUniversities}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        onRemove={handleRemoveFromComparison}
      />
    </div>
  );
};

export default Universities;
