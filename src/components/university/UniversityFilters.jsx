import { useState } from 'react';
import FormSelect from '../common/FormSelect';
import FormInput from '../common/FormInput';
import Button from '../common/Button';

const UniversityFilters = ({ onFiltersChange, loading = false }) => {
  const [filters, setFilters] = useState({
    country: '',
    type: '',
    tuitionMin: '',
    tuitionMax: '',
    rankingMax: '',
    search: ''
  });

  const countryOptions = [
    { value: '', label: 'All Countries' },
    { value: 'USA', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'France', label: 'France' },
    { value: 'Ireland', label: 'Ireland' },
    { value: 'New Zealand', label: 'New Zealand' },
    { value: 'Singapore', label: 'Singapore' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' }
  ];

  const handleFilterChange = (name, value) => {
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    
    // Convert string numbers to numbers for the service
    const processedFilters = {
      ...newFilters,
      tuitionMin: newFilters.tuitionMin ? parseInt(newFilters.tuitionMin) : undefined,
      tuitionMax: newFilters.tuitionMax ? parseInt(newFilters.tuitionMax) : undefined,
      rankingMax: newFilters.rankingMax ? parseInt(newFilters.rankingMax) : undefined
    };
    
    // Remove empty filters
    Object.keys(processedFilters).forEach(key => {
      if (processedFilters[key] === '' || processedFilters[key] === undefined) {
        delete processedFilters[key];
      }
    });
    
    onFiltersChange(processedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      country: '',
      type: '',
      tuitionMin: '',
      tuitionMax: '',
      rankingMax: '',
      search: ''
    };
    setFilters(resetFilters);
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="text-secondary-500 hover:text-secondary-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search */}
        <FormInput
          label="Search Universities"
          name="search"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="University name or program..."
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />

        {/* Country Filter */}
        <FormSelect
          label="Country"
          options={countryOptions}
          value={filters.country}
          onChange={(e) => handleFilterChange('country', e.target.value)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        {/* University Type */}
        <FormSelect
          label="University Type"
          options={typeOptions}
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        {/* Tuition Range */}
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Min Tuition (USD)"
            name="tuitionMin"
            type="number"
            value={filters.tuitionMin}
            onChange={(e) => handleFilterChange('tuitionMin', e.target.value)}
            placeholder="e.g., 20000"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          <FormInput
            label="Max Tuition (USD)"
            name="tuitionMax"
            type="number"
            value={filters.tuitionMax}
            onChange={(e) => handleFilterChange('tuitionMax', e.target.value)}
            placeholder="e.g., 50000"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
        </div>

        {/* Ranking Filter */}
        <FormInput
          label="Maximum Ranking"
          name="rankingMax"
          type="number"
          value={filters.rankingMax}
          onChange={(e) => handleFilterChange('rankingMax', e.target.value)}
          placeholder="e.g., 100"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />

        {/* Quick Filter Buttons */}
        <div className="pt-4 border-t border-secondary-200">
          <p className="text-sm font-semibold text-secondary-700 mb-3">Quick Filters</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                handleFilterChange('country', 'USA');
                handleFilterChange('rankingMax', '50');
              }}
              className="p-2 text-sm rounded-xl border-2 border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-300"
              disabled={loading}
            >
              Top 50 US
            </button>
            <button
              onClick={() => {
                handleFilterChange('tuitionMax', '30000');
              }}
              className="p-2 text-sm rounded-xl border-2 border-success-200 bg-success-50 text-success-700 hover:bg-success-100 transition-colors duration-300"
              disabled={loading}
            >
              Affordable (&lt;$30k)
            </button>
            <button
              onClick={() => {
                handleFilterChange('country', 'Canada');
              }}
              className="p-2 text-sm rounded-xl border-2 border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 transition-colors duration-300"
              disabled={loading}
            >
              Canada
            </button>
            <button
              onClick={() => {
                handleFilterChange('type', 'public');
              }}
              className="p-2 text-sm rounded-xl border-2 border-warning-200 bg-warning-50 text-warning-700 hover:bg-warning-100 transition-colors duration-300"
              disabled={loading}
            >
              Public Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityFilters;
