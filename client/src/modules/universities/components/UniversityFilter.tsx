import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { UniversityFilters } from '../../../types/university';

interface UniversityFilterProps {
  filters: UniversityFilters;
  onApply: (filters: UniversityFilters) => void;
  onClose: () => void;
}

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'Singapore',
  'New Zealand',
];

const UNIVERSITY_TYPES = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

export const UniversityFilter: React.FC<UniversityFilterProps> = ({
  filters,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<UniversityFilters>(filters);

  const handleInputChange = (field: keyof UniversityFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: UniversityFilters = {
      country: '',
      state: '',
      type: '',
      minRanking: '',
      maxRanking: '',
      minTuition: '',
      maxTuition: '',
    };
    setLocalFilters(resetFilters);
  };

  return (
    <div className="space-y-6">
      {/* Location Filters */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={localFilters.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <Input
              type="text"
              placeholder="Enter state or province"
              value={localFilters.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* University Type */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">University Type</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value=""
              checked={localFilters.type === ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="mr-2 text-primary-600 focus:ring-primary-500"
            />
            All Types
          </label>
          {UNIVERSITY_TYPES.map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={localFilters.type === type.value}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      {/* Ranking Filter */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ranking</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Ranking
            </label>
            <Input
              type="number"
              placeholder="e.g., 1"
              value={localFilters.minRanking}
              onChange={(e) => handleInputChange('minRanking', e.target.value)}
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Ranking
            </label>
            <Input
              type="number"
              placeholder="e.g., 100"
              value={localFilters.maxRanking}
              onChange={(e) => handleInputChange('maxRanking', e.target.value)}
              min="1"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Leave empty to include all ranked universities
        </p>
      </div>

      {/* Tuition Filter */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Tuition (USD)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum
            </label>
            <Input
              type="number"
              placeholder="e.g., 10000"
              value={localFilters.minTuition}
              onChange={(e) => handleInputChange('minTuition', e.target.value)}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum
            </label>
            <Input
              type="number"
              placeholder="e.g., 50000"
              value={localFilters.maxTuition}
              onChange={(e) => handleInputChange('maxTuition', e.target.value)}
              min="0"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Enter your budget range to find suitable universities
        </p>
      </div>

      {/* Popular Filter Presets */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Filters</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocalFilters(prev => ({
              ...prev,
              country: 'United States',
              maxRanking: '50',
            }))}
            className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Top US Universities</div>
            <div className="text-sm text-gray-500">Ranked top 50 in US</div>
          </button>
          <button
            onClick={() => setLocalFilters(prev => ({
              ...prev,
              country: 'United Kingdom',
              maxRanking: '30',
            }))}
            className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Top UK Universities</div>
            <div className="text-sm text-gray-500">Ranked top 30 in UK</div>
          </button>
          <button
            onClick={() => setLocalFilters(prev => ({
              ...prev,
              maxTuition: '30000',
            }))}
            className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Affordable Options</div>
            <div className="text-sm text-gray-500">Under $30,000 tuition</div>
          </button>
          <button
            onClick={() => setLocalFilters(prev => ({
              ...prev,
              type: 'public',
            }))}
            className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Public Universities</div>
            <div className="text-sm text-gray-500">State-funded institutions</div>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
