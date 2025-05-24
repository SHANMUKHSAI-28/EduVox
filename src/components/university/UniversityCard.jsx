import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { savedUniversitiesService } from '../../services/universityService';
import Button from '../common/Button';
import UniversityLogo from './UniversityLogo';

const UniversityCard = ({ 
  university, 
  match, 
  onSave, 
  onRemove, 
  isSaved = false,
  showMatch = true,
  onCompare
}) => {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSaveToggle = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      if (isSaved) {
        await savedUniversitiesService.removeSavedUniversity(currentUser.uid, university.id);
        if (onRemove) onRemove(university.id);
      } else {
        await savedUniversitiesService.saveUniversity(currentUser.uid, university.id);
        if (onSave) onSave(university);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setSaving(false);
    }
  };

  const getMatchBadge = () => {
    if (!match || !showMatch) return null;

    const colors = {
      safety: 'bg-success-100 text-success-700 border-success-200',
      target: 'bg-warning-100 text-warning-700 border-warning-200',
      ambitious: 'bg-danger-100 text-danger-700 border-danger-200'
    };

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[match.category]}`}>
        <div className="flex items-center gap-1">
          <span className="capitalize">{match.category}</span>
          <span className="text-xs opacity-75">({match.score}%)</span>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Not specified';
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-[1.02]">      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <UniversityLogo 
            university={university} 
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors duration-300">
              {university.name}
            </h3>
            <div className="flex items-center gap-2 text-secondary-600 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">
                {university.city}, {university.state && `${university.state}, `}{university.country}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          className={`p-2 rounded-xl transition-all duration-300 ${
            isSaved
              ? 'text-danger-600 hover:bg-danger-50 hover:text-danger-700'
              : 'text-secondary-400 hover:bg-primary-50 hover:text-primary-600'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : isSaved ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Match Badge */}
      {showMatch && match && (
        <div className="mb-4">
          {getMatchBadge()}
        </div>
      )}

      {/* University Details */}
      <div className="space-y-3 mb-6">        {/* Type, Ranking, and Verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              university.type === 'private' 
                ? 'bg-accent-100 text-accent-700' 
                : 'bg-primary-100 text-primary-700'
            }`}>
              {university.type === 'private' ? 'Private' : 'Public'}
            </span>
            {university.ranking_overall && (
              <span className="text-sm text-secondary-600">
                Rank #{university.ranking_overall}
              </span>
            )}
            {/* Verification Status */}
            {university.isVerified ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Pending Review</span>
              </div>
            )}
          </div>
        </div>

        {/* Tuition */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span className="text-sm text-secondary-700">
            {university.tuition_min === university.tuition_max 
              ? formatCurrency(university.tuition_min)
              : `${formatCurrency(university.tuition_min)} - ${formatCurrency(university.tuition_max)}`
            } / year
          </span>
        </div>

        {/* Application Deadline */}
        {university.application_deadline && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-secondary-700">
              Deadline: {formatDeadline(university.application_deadline)}
            </span>
          </div>
        )}

        {/* Requirements */}
        {showMatch && match && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {match.details.cgpaMatch !== null && (
              <div className={`flex items-center gap-1 ${match.details.cgpaMatch ? 'text-success-600' : 'text-danger-600'}`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  {match.details.cgpaMatch ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                <span>CGPA {university.cgpa_requirement}</span>
              </div>
            )}
            {match.details.englishMatch !== null && (
              <div className={`flex items-center gap-1 ${match.details.englishMatch ? 'text-success-600' : 'text-danger-600'}`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  {match.details.englishMatch ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                <span>English</span>
              </div>
            )}
          </div>
        )}

        {/* Programs Offered (truncated) */}
        {university.programs_offered && university.programs_offered.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {university.programs_offered.slice(0, 3).map((program, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-lg text-xs"
              >
                {program}
              </span>
            ))}
            {university.programs_offered.length > 3 && (
              <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-lg text-xs">
                +{university.programs_offered.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => window.open(university.website, '_blank')}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Visit Website
        </Button>
        
        {onCompare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCompare(university)}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare
          </Button>
        )}
      </div>
    </div>
  );
};

export default UniversityCard;
