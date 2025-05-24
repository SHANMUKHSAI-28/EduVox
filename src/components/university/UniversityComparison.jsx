import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { exportComparisonPDF } from '../../utils/pdfExport';
import { useAuth } from '../../contexts/AuthContext';

const UniversityComparison = ({ universities, onRemove, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState({
    basic: true,
    requirements: true,
    financial: true,
    programs: true
  });

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
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  const exportComparison = () => {
    try {
      exportComparisonPDF(universities, currentUser?.email);
    } catch (error) {
      console.error('Error exporting comparison PDF:', error);
      // Could add toast notification here if available
    }
  };

  if (!isOpen || universities.length === 0) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="University Comparison" size="max">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedCategories).map(([category, isSelected]) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isSelected
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                    : 'bg-secondary-100 text-secondary-600 border-2 border-secondary-200 hover:bg-secondary-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportComparison}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white/80 backdrop-blur-sm border-b-2 border-secondary-200 p-4 text-left font-semibold text-secondary-900 min-w-[200px]">
                  University
                </th>
                {universities.map((university, index) => (
                  <th
                    key={university.id}
                    className="border-b-2 border-secondary-200 p-4 text-center min-w-[250px] relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {university.logo_url && (
                          <img
                            src={university.logo_url}
                            alt={`${university.name} logo`}
                            className="w-8 h-8 rounded-lg object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <h3 className="font-bold text-secondary-900 text-sm leading-tight">
                          {university.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => onRemove(university.id)}
                        className="absolute top-2 right-2 p-1 text-secondary-400 hover:text-danger-600 transition-colors duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Basic Information */}
              {selectedCategories.basic && (
                <>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      Location
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.city}, {university.country}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      Type
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          university.type === 'private' 
                            ? 'bg-accent-100 text-accent-700' 
                            : 'bg-primary-100 text-primary-700'
                        }`}>
                          {university.type === 'private' ? 'Private' : 'Public'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      Ranking
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.ranking_overall ? `#${university.ranking_overall}` : 'Not ranked'}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Financial Information */}
              {selectedCategories.financial && (
                <>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      Tuition Range
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.tuition_min === university.tuition_max 
                          ? formatCurrency(university.tuition_min)
                          : `${formatCurrency(university.tuition_min)} - ${formatCurrency(university.tuition_max)}`
                        }
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      Application Deadline
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {formatDeadline(university.application_deadline)}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Requirements */}
              {selectedCategories.requirements && (
                <>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      CGPA Required
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.cgpa_requirement || 'Not specified'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      IELTS Required
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.ielts_requirement || 'Not specified'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      TOEFL Required
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.toefl_requirement || 'Not specified'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                      GRE Required
                    </td>
                    {universities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                        {university.gre_requirement || 'Not specified'}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Programs */}
              {selectedCategories.programs && (
                <tr>
                  <td className="sticky left-0 bg-white/80 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700">
                    Programs Offered
                  </td>
                  {universities.map((university) => (
                    <td key={university.id} className="border-b border-secondary-100 p-4 text-left text-sm">
                      {university.programs_offered && university.programs_offered.length > 0 ? (
                        <div className="space-y-1">
                          {university.programs_offered.slice(0, 5).map((program, index) => (
                            <div key={index} className="px-2 py-1 bg-secondary-100 rounded text-xs">
                              {program}
                            </div>
                          ))}
                          {university.programs_offered.length > 5 && (
                            <div className="text-xs text-secondary-500 italic">
                              +{university.programs_offered.length - 5} more
                            </div>
                          )}
                        </div>
                      ) : (
                        'Not specified'
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Website Links */}
              <tr>
                <td className="sticky left-0 bg-white/80 backdrop-blur-sm p-4 font-medium text-secondary-700">
                  Website
                </td>
                {universities.map((university) => (
                  <td key={university.id} className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(university.website, '_blank')}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default UniversityComparison;
