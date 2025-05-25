import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import studyAbroadService from '../../services/studyAbroadService';
import { formatDate } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

const PathwayHistory = () => {
  const { currentUser } = useAuth();
  const [pathwayHistory, setPathwayHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPathwayHistory = async () => {
      if (!currentUser) return;      try {
        setLoading(true);
        const history = await studyAbroadService.getUserPathways(currentUser.uid);
        setPathwayHistory(history);
      } catch (err) {
        console.error('Error fetching pathway history:', err);
        setError('Failed to load pathway history');
      } finally {
        setLoading(false);
      }
    };

    fetchPathwayHistory();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-secondary-600">Loading pathway history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <div className="text-center">
            <div className="text-danger-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Error Loading History</h3>
            <p className="text-secondary-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-6">
          <h1 className="text-2xl font-bold text-white mb-2">Study Abroad Pathway History</h1>
          <p className="text-primary-100">View all your generated study abroad pathways</p>
        </div>

        <div className="p-8">
          {pathwayHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-secondary-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Pathway History</h3>
              <p className="text-secondary-600 mb-6">You haven't generated any study abroad pathways yet.</p>
              <div className="space-x-4">
                <Link 
                  to="/my-study-path"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  Create Your Study Path
                </Link>                <Link 
                  to="/uniguidepro"
                  className="inline-flex items-center px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors duration-200"
                >
                  Explore UniGuidePro
                </Link>
              </div>
            </div>
          ) : (            <div className="space-y-6">
              {pathwayHistory.map((pathway, index) => (
                <div key={`${pathway.id}_${pathway.createdAt}_${index}`} className="border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        Study Abroad Pathway #{pathwayHistory.length - index}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-secondary-600">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12l-4-4m0 0l4-4m-4 4h12" />
                          </svg>
                          Created: {formatDate(pathway.createdAt)}
                        </span>
                        {pathway.updatedAt && pathway.updatedAt !== pathway.createdAt && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Updated: {formatDate(pathway.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-secondary-600 mb-1">Progress</div>
                      <div className="text-lg font-semibold text-primary-600">
                        {Math.round((pathway.steps?.filter(step => step.status === 'completed').length || 0) / (pathway.steps?.length || 1) * 100)}%
                      </div>
                    </div>
                  </div>                  {/* Pathway Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <div className="text-sm text-secondary-600 mb-1">Target Country</div>
                      <div className="text-sm font-medium text-secondary-900">
                        {pathway.country || 'Not specified'}
                      </div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <div className="text-sm text-secondary-600 mb-1">Field of Study</div>
                      <div className="text-sm font-medium text-secondary-900">
                        {pathway.course || 'Not specified'}
                      </div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <div className="text-sm text-secondary-600 mb-1">Academic Level</div>
                      <div className="text-sm font-medium text-secondary-900">
                        {pathway.academicLevel || 'Not specified'}
                      </div>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <div className="text-sm text-secondary-600 mb-1">Total Steps</div>
                      <div className="text-sm font-medium text-secondary-900">
                        {pathway.steps?.length || 0} steps
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (pathway.steps?.filter(step => step.status === 'completed').length || 0) === (pathway.steps?.length || 0)
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {(pathway.steps?.filter(step => step.status === 'completed').length || 0) === (pathway.steps?.length || 0)
                          ? 'Completed'
                          : 'In Progress'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/my-study-path?pathwayId=${pathway.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                      >
                        View Details
                      </Link>
                      <button className="text-secondary-500 hover:text-secondary-600 text-sm font-medium transition-colors duration-200">
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PathwayHistory;
