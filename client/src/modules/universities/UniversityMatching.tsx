import React, { useState } from 'react';
import { Search, Target, RefreshCw, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { UniversityCard } from './components/UniversityCard';
import { AcademicProfile, University } from '../../types/university';
import { universityAPI } from '../../utils/api';

export const UniversityMatching: React.FC = () => {
  const { currentUser } = useAuth();
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile>({
    cgpa: 3.0,
    ieltsScore: undefined,
    toeflScore: undefined,
    greScore: undefined,
    budgetMin: undefined,
    budgetMax: undefined,
    preferredCountries: [],
  });
  const [matches, setMatches] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [savedUniversities, setSavedUniversities] = useState<Set<number>>(new Set());

  const countries = [
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

  const handleInputChange = (field: keyof AcademicProfile, value: any) => {
    setAcademicProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCountryToggle = (country: string) => {
    setAcademicProfile(prev => ({
      ...prev,
      preferredCountries: prev.preferredCountries?.includes(country)
        ? prev.preferredCountries.filter(c => c !== country)
        : [...(prev.preferredCountries || []), country],
    }));
  };

  const findMatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await universityAPI.matchUniversities(academicProfile);
      setMatches(response.data.matches);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to find matching universities');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUniversity = async (university: University) => {
    if (!currentUser) return;

    try {
      if (savedUniversities.has(university.id)) {
        // Remove from saved (you'll need to implement this)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">University Matching</h1>
          <p className="text-gray-600">
            Find universities that match your academic profile and preferences
          </p>
        </div>

        {/* Academic Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Academic Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CGPA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CGPA (out of 4.0) *
              </label>
              <Input
                type="number"
                min="0"
                max="4"
                step="0.1"
                placeholder="e.g., 3.5"
                value={academicProfile.cgpa}
                onChange={(e) => handleInputChange('cgpa', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            {/* IELTS Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IELTS Score (out of 9.0)
              </label>
              <Input
                type="number"
                min="0"
                max="9"
                step="0.5"
                placeholder="e.g., 7.0"
                value={academicProfile.ieltsScore || ''}
                onChange={(e) => handleInputChange('ieltsScore', parseFloat(e.target.value) || undefined)}
              />
            </div>

            {/* TOEFL Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TOEFL Score (out of 120)
              </label>
              <Input
                type="number"
                min="0"
                max="120"
                placeholder="e.g., 100"
                value={academicProfile.toeflScore || ''}
                onChange={(e) => handleInputChange('toeflScore', parseInt(e.target.value) || undefined)}
              />
            </div>

            {/* GRE Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GRE Score (out of 340)
              </label>
              <Input
                type="number"
                min="0"
                max="340"
                placeholder="e.g., 320"
                value={academicProfile.greScore || ''}
                onChange={(e) => handleInputChange('greScore', parseInt(e.target.value) || undefined)}
              />
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Min (USD/year)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 20000"
                value={academicProfile.budgetMin || ''}
                onChange={(e) => handleInputChange('budgetMin', parseInt(e.target.value) || undefined)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Max (USD/year)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 50000"
                value={academicProfile.budgetMax || ''}
                onChange={(e) => handleInputChange('budgetMax', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          {/* Preferred Countries */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Countries
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {countries.map((country) => (
                <label key={country} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={academicProfile.preferredCountries?.includes(country) || false}
                    onChange={() => handleCountryToggle(country)}
                    className="mr-2 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{country}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={findMatches}
              loading={loading}
              disabled={loading || !academicProfile.cgpa}
              className="flex items-center px-8 py-3"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Target className="h-5 w-5 mr-2" />
              )}
              Find Matching Universities
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Matching Universities ({matches.length} found)
              </h2>
              <p className="text-gray-600">
                Universities that match your academic profile, sorted by relevance
              </p>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your criteria or consider alternative options:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Lower your CGPA requirement slightly</p>
                  <p>• Increase your budget range</p>
                  <p>• Add more preferred countries</p>
                  <p>• Consider universities without strict test score requirements</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((university) => (
                  <UniversityCard
                    key={university.id}
                    university={university}
                    isSaved={savedUniversities.has(university.id)}
                    isSelected={false}
                    isAuthenticated={!!currentUser}
                    onSave={() => handleSaveUniversity(university)}
                    onCompareToggle={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Helpful Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Tips for Better Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Academic Scores</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Enter your actual scores for accurate matches</li>
                <li>• Consider retaking tests if needed</li>
                <li>• Some universities waive test requirements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Budget Planning</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Include living expenses in your budget</li>
                <li>• Research scholarship opportunities</li>
                <li>• Consider public universities for lower costs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Country Selection</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Consider visa requirements</li>
                <li>• Research work opportunities post-study</li>
                <li>• Factor in cost of living differences</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Application Strategy</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Apply to a mix of reach and safety schools</li>
                <li>• Start applications early</li>
                <li>• Prepare strong personal statements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
