import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Globe, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { UniversityCard } from './components/UniversityCard';
import { UniversityFilter } from './components/UniversityFilter';
import { UniversityComparison } from './components/UniversityComparison';
import { University } from '../../types/university';
import { universityAPI } from '../../utils/api';

interface UniversityListProps {
  showSavedOnly?: boolean;
}

export const UniversityList: React.FC<UniversityListProps> = ({ showSavedOnly = false }) => {
  const { currentUser } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedUniversities, setSelectedUniversities] = useState<University[]>([]);
  const [savedUniversities, setSavedUniversities] = useState<Set<number>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    country: '',
    state: '',
    type: '',
    minRanking: '',
    maxRanking: '',
    minTuition: '',
    maxTuition: '',
  });

  useEffect(() => {
    fetchUniversities();
    if (currentUser) {
      fetchSavedUniversities();
    }
  }, [currentPage, filters, searchTerm, showSavedOnly]);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError('');

      if (showSavedOnly && currentUser) {
        const response = await universityAPI.getSavedUniversities();
        setUniversities(response.data.savedUniversities.map((item: any) => ({
          id: item.university_id,
          name: item.name,
          country: item.country,
          state: item.state,
          city: item.city,
          type: item.type,
          ranking: item.ranking,
          tuition_min: item.tuition_min,
          tuition_max: item.tuition_max,
          logo_url: item.logo_url,
          website: item.website,
          saved_id: item.id
        })));
        setTotalCount(response.data.savedUniversities.length);
        setTotalPages(1);
      } else {
        const params = {
          page: currentPage,
          limit: 12,
          search: searchTerm,
          ...filters
        };

        const response = await universityAPI.getUniversities(params);
        setUniversities(response.data.universities);
        setTotalPages(response.data.pagination.pages);
        setTotalCount(response.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch universities');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedUniversities = async () => {
    try {
      const response = await universityAPI.getSavedUniversities();
      const savedIds = new Set(response.data.savedUniversities.map((item: any) => item.university_id));
      setSavedUniversities(savedIds);
    } catch (err) {
      console.error('Failed to fetch saved universities:', err);
    }
  };

  const handleSaveUniversity = async (university: University) => {
    if (!currentUser) return;

    try {
      if (savedUniversities.has(university.id)) {
        // Find the saved university record to get the saved_id
        const savedUni = universities.find(u => u.id === university.id);
        if (savedUni?.saved_id) {
          await universityAPI.removeSavedUniversity(savedUni.saved_id);
        }
        setSavedUniversities(prev => {
          const newSet = new Set(prev);
          newSet.delete(university.id);
          return newSet;
        });
      } else {
        await universityAPI.saveUniversity(university.id);
        setSavedUniversities(prev => new Set([...prev, university.id]));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update saved university');
    }
  };

  const handleCompareToggle = (university: University) => {
    setSelectedUniversities(prev => {
      const isSelected = prev.some(u => u.id === university.id);
      if (isSelected) {
        return prev.filter(u => u.id !== university.id);
      } else if (prev.length < 3) {
        return [...prev, university];
      }
      return prev;
    });
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      country: '',
      state: '',
      type: '',
      minRanking: '',
      maxRanking: '',
      minTuition: '',
      maxTuition: '',
    });
    setCurrentPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showSavedOnly ? 'Saved Universities' : 'Explore Universities'}
          </h1>
          <p className="text-gray-600">
            {showSavedOnly
              ? 'Your shortlisted universities for comparison and application'
              : 'Discover the perfect university for your academic journey'
            }
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search universities by name or city..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {selectedUniversities.length > 0 && (
                <Button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center"
                >
                  Compare ({selectedUniversities.length})
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {Object.values(filters).some(value => value) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => 
                value ? (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {key}: {value}
                  </span>
                ) : null
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* University Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : universities.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showSavedOnly ? 'No saved universities' : 'No universities found'}
            </h3>
            <p className="text-gray-500">
              {showSavedOnly
                ? 'Start exploring universities and save them to your list'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {universities.map((university) => (
                <UniversityCard
                  key={university.id}
                  university={university}
                  isSaved={savedUniversities.has(university.id)}
                  isSelected={selectedUniversities.some(u => u.id === university.id)}
                  isAuthenticated={!!currentUser}
                  onSave={() => handleSaveUniversity(university)}
                  onCompareToggle={() => handleCompareToggle(university)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Universities"
        maxWidth="lg"
      >
        <UniversityFilter
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      </Modal>

      {/* Comparison Modal */}
      <Modal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        title="Compare Universities"
        maxWidth="2xl"
      >
        <UniversityComparison
          universities={selectedUniversities}
          onClose={() => setShowComparison(false)}
          onRemove={(university) => {
            setSelectedUniversities(prev => prev.filter(u => u.id !== university.id));
          }}
        />
      </Modal>
    </div>
  );
};
