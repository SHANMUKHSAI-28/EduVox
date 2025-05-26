import { useState } from 'react';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { exportComparisonPDF } from '../../utils/pdfExport';
import { useAuth } from '../../contexts/AuthContext';

const UniversityComparisonEnhanced = ({ universities, onRemove, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { planType, canPerformAction, trackUsage } = useSubscriptionLimits();
  const [selectedCategories, setSelectedCategories] = useState({
    basic: true,
    requirements: true,
    financial: true,
    programs: true
  });  const [currentPage, setCurrentPage] = useState(0);
  const [universitiesPerPage] = useState(4); // Show 4 universities per page for better readability

  const isFreePlan = planType === 'free';

  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
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

  // Pagination logic
  const totalPages = Math.ceil(universities.length / universitiesPerPage);
  const startIndex = currentPage * universitiesPerPage;
  const endIndex = Math.min(startIndex + universitiesPerPage, universities.length);
  const currentUniversities = universities.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const exportComparison = async () => {
    // Check subscription restrictions for PDF export
    if (isFreePlan) {
      alert('PDF export is available for Premium and Pro users. Please upgrade your plan.');
      return;
    }

    try {
      await exportComparisonPDF(universities, currentUser?.email);
      console.log('Comparison PDF exported successfully');
    } catch (error) {
      console.error('Error exporting comparison PDF:', error);
    }
  };

  if (!isOpen || universities.length === 0) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`University Comparison (${universities.length})`} size="max">
      <div className="space-y-6">
        {/* Subscription Status Banner */}
        {isFreePlan && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Free Plan - Enhanced comparison features
                  </p>
                  <p className="text-xs text-amber-600">
                    Upgrade to Premium or Pro for PDF export and unlimited comparisons
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors duration-200"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Header Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportComparison}
              disabled={isFreePlan}
              className={isFreePlan ? 'opacity-50 cursor-not-allowed' : ''}
              title={isFreePlan ? 'PDF export available for Premium and Pro users' : 'Export all universities as PDF'}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export All ({universities.length}) {isFreePlan && '(Premium)'}
            </Button>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-secondary-50 px-4 py-3 rounded-lg">
            <div className="text-sm text-secondary-600">
              Showing {startIndex + 1}-{endIndex} of {universities.length} universities
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 0}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>
              <span className="px-3 py-1 bg-white rounded border text-sm">
                {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-secondary-200 rounded-lg">
          <div className="min-w-max">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white/90 backdrop-blur-sm border-b-2 border-secondary-200 p-4 text-left font-semibold text-secondary-900 min-w-[200px] z-10 border-r border-secondary-200">
                    University
                  </th>
                  {currentUniversities.map((university, index) => (
                    <th
                      key={university.id}
                      className="border-b-2 border-secondary-200 p-4 text-center min-w-[200px] relative bg-white"
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
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        Location
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.location?.city || university.city}, {university.location?.country || university.country}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        Type
                      </td>
                      {currentUniversities.map((university) => (
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
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        Ranking
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.ranking?.world ? `#${university.ranking.world}` : 
                           university.ranking_overall ? `#${university.ranking_overall}` : 'Not ranked'}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Financial Information */}
                {selectedCategories.financial && (
                  <>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        Tuition Range
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.tuitionRange ? 
                            `${formatCurrency(university.tuitionRange.min)} - ${formatCurrency(university.tuitionRange.max)}` :
                            university.tuition_min === university.tuition_max ? 
                              formatCurrency(university.tuition_min) :
                              `${formatCurrency(university.tuition_min)} - ${formatCurrency(university.tuition_max)}`
                          }
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        Application Deadline
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {formatDeadline(university.applicationDeadlines?.fall || university.application_deadline)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Requirements */}
                {selectedCategories.requirements && (
                  <>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        CGPA Required
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.requirements?.minimumCGPA || university.cgpa_requirement || 'Not specified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        IELTS Required
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.requirements?.englishProficiency?.ielts || university.ielts_requirement || 'Not specified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        TOEFL Required
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.requirements?.englishProficiency?.toefl || university.toefl_requirement || 'Not specified'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                        GRE Required
                      </td>
                      {currentUniversities.map((university) => (
                        <td key={university.id} className="border-b border-secondary-100 p-4 text-center text-sm">
                          {university.requirements?.gre?.required ? 'Yes' : 
                           university.gre_requirement ? university.gre_requirement : 'Not specified'}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Programs */}
                {selectedCategories.programs && (
                  <tr>
                    <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-b border-secondary-100 p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                      Programs Offered
                    </td>
                    {currentUniversities.map((university) => (
                      <td key={university.id} className="border-b border-secondary-100 p-4 text-left text-sm">
                        {(university.programs || university.programs_offered) && 
                         (university.programs || university.programs_offered).length > 0 ? (
                          <div className="space-y-1">
                            {(university.programs || university.programs_offered).slice(0, 3).map((program, index) => (
                              <div key={index} className="px-2 py-1 bg-secondary-100 rounded text-xs">
                                {program}
                              </div>
                            ))}
                            {(university.programs || university.programs_offered).length > 3 && (
                              <div className="text-xs text-secondary-500 italic">
                                +{(university.programs || university.programs_offered).length - 3} more
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
                  <td className="sticky left-0 bg-white/90 backdrop-blur-sm p-4 font-medium text-secondary-700 border-r border-secondary-200 z-10">
                    Website
                  </td>
                  {currentUniversities.map((university) => (
                    <td key={university.id} className="p-4 text-center">
                      {university.website ? (
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
                      ) : (
                        <span className="text-xs text-secondary-500">Not available</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Info */}
        {universities.length > 4 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-primary-700">
                You're comparing {universities.length} universities. Use pagination above to view all comparisons, 
                or export to PDF to see everything in one document.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UniversityComparisonEnhanced;
