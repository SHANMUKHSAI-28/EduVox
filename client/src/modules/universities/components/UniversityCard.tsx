import React from 'react';
import { MapPin, Globe, Heart, CheckSquare, Square, ExternalLink, Users, DollarSign } from 'lucide-react';
import { University } from '../../../types/university';
import { Button } from '../../../components/common/Button';

interface UniversityCardProps {
  university: University;
  isSaved: boolean;
  isSelected: boolean;
  isAuthenticated: boolean;
  onSave: () => void;
  onCompareToggle: () => void;
}

export const UniversityCard: React.FC<UniversityCardProps> = ({
  university,
  isSaved,
  isSelected,
  isAuthenticated,
  onSave,
  onCompareToggle,
}) => {
  const formatTuition = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Contact for fees';
    if (!max) return `$${min?.toLocaleString()}+`;
    if (!min) return `Up to $${max?.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const getTypeColor = (type: string) => {
    return type === 'public' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getRankingBadge = (ranking: number | null) => {
    if (!ranking) return null;
    
    let color = 'bg-gray-100 text-gray-800';
    if (ranking <= 10) color = 'bg-yellow-100 text-yellow-800';
    else if (ranking <= 50) color = 'bg-blue-100 text-blue-800';
    else if (ranking <= 100) color = 'bg-green-100 text-green-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        #{ranking}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* University Image/Logo */}
      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-600 rounded-t-lg overflow-hidden">
        {university.logo_url ? (
          <img
            src={university.logo_url}
            alt={`${university.name} logo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Globe className="h-16 w-16 text-white opacity-50" />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          {isAuthenticated && (
            <button
              onClick={onSave}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                isSaved
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save university'}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
          <button
            onClick={onCompareToggle}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Ranking Badge */}
        {university.ranking && (
          <div className="absolute top-3 left-3">
            {getRankingBadge(university.ranking)}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {university.name}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {university.city}, {university.state}, {university.country}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(university.type)}`}>
              {university.type === 'public' ? 'Public' : 'Private'}
            </span>
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 p-1"
                title="Visit website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* University Details */}
        <div className="space-y-3">
          {/* Tuition */}
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-sm">
              {formatTuition(university.tuition_min, university.tuition_max)}
            </span>
          </div>

          {/* Requirements */}
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">Requirements:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {university.cgpa_requirement && (
                <div>CGPA: {university.cgpa_requirement}</div>
              )}
              {university.ielts_requirement && (
                <div>IELTS: {university.ielts_requirement}</div>
              )}
              {university.toefl_requirement && (
                <div>TOEFL: {university.toefl_requirement}</div>
              )}
              {university.gre_requirement && (
                <div>GRE: {university.gre_requirement}</div>
              )}
            </div>
          </div>

          {/* Description */}
          {university.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {university.description}
            </p>
          )}

          {/* Match Score */}
          {university.match_score && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Match Score</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${university.match_score}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-primary-600">
                    {Math.round(university.match_score)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              // Navigate to university details page
              window.open(`/universities/${university.id}`, '_blank');
            }}
          >
            View Details
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              // Navigate to application page
              window.open(`/applications/new?university=${university.id}`, '_blank');
            }}
          >
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
};
