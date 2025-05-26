import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { savedUniversitiesService } from '../services/universityService';
import { exportUniversitiesPDF } from '../utils/pdfExport';
import Sidebar from '../components/common/Sidebar';
import UniversityCard from '../components/university/UniversityCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';

const ShortlistedUniversities = () => {
  const { currentUser } = useAuth();
  const { planType, trackUsage, canPerformAction, getRemainingCount, showUpgradePrompt } = useSubscriptionLimits();
  const [sidebarOpen, setSidebarOpen] = useState(false);  const [shortlistedUniversities, setShortlistedUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const isFreePlan = planType === 'free';

  useEffect(() => {
    if (currentUser) {
      loadShortlistedUniversities();
    }
  }, [currentUser]);

  const loadShortlistedUniversities = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const universities = await savedUniversitiesService.getSavedUniversities(currentUser.uid);
      setShortlistedUniversities(universities);
    } catch (error) {
      console.error('Error loading shortlisted universities:', error);
      setAlert({ 
        type: 'error', 
        message: 'Failed to load your shortlisted universities. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromShortlist = async (universityId) => {
    try {
      await savedUniversitiesService.removeSavedUniversity(currentUser.uid, universityId);
      setShortlistedUniversities(prev => 
        prev.filter(university => university.id !== universityId)
      );
      setAlert({ 
        type: 'success', 
        message: 'University removed from shortlist successfully!' 
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error removing university from shortlist:', error);
      setAlert({ 
        type: 'error', 
        message: 'Failed to remove university from shortlist. Please try again.' 
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleClearAllShortlisted = async () => {
    if (!window.confirm('Are you sure you want to remove all universities from your shortlist? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // Remove all universities one by one
      for (const university of shortlistedUniversities) {
        await savedUniversitiesService.removeSavedUniversity(currentUser.uid, university.id);
      }
      setShortlistedUniversities([]);
      setAlert({ 
        type: 'success', 
        message: 'All universities removed from shortlist successfully!' 
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error clearing shortlist:', error);
      setAlert({ 
        type: 'error', 
        message: 'Failed to clear shortlist. Please try again.' 
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    // Check subscription limits for PDF export
    if (!canPerformAction('exportPdf')) {
      showUpgradePrompt('exportPdf', () => {
        window.location.href = '/profile?tab=subscription';
      });
      return;
    }

    if (shortlistedUniversities.length === 0) {
      setAlert({ type: 'warning', message: 'No universities to export. Your shortlist is empty.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      // Track usage for subscription limits
      const tracked = await trackUsage('exportPdf');
      if (!tracked) {
        setAlert({ type: 'error', message: 'Failed to track usage. Please try again.' });
        setTimeout(() => setAlert(null), 3000);
        return;
      }

      // Export PDF with user profile (if available)
      await exportUniversitiesPDF(shortlistedUniversities, null, currentUser?.email);
      
      const remaining = getRemainingCount('exportPdf');
      setAlert({ 
        type: 'success', 
        message: `PDF exported successfully! ${isFreePlan ? `${remaining} exports remaining this month.` : ''}` 
      });
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setAlert({ 
        type: 'error', 
        message: 'Failed to export PDF. Please try again.' 
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const EmptyState = () => (
    <div className="text-center py-16 lg:py-24">
      <div className="mx-auto w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mb-6 lg:mb-8">
        <svg className="w-12 h-12 lg:w-16 lg:h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 className="text-2xl lg:text-3xl font-bold text-secondary-900 mb-4">No Shortlisted Universities</h3>
      <p className="text-lg text-secondary-600 max-w-md mx-auto mb-8 leading-relaxed">
        You haven't shortlisted any universities yet. Start exploring and find your perfect educational match!
      </p>
      <Button
        href="/universities"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all duration-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Discover Universities
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-accent-50/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header for sidebar toggle */}
        <div className="lg:hidden bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Shortlisted Universities
              </h1>
            </div>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="px-3 sm:px-4 lg:px-6 py-4">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="pt-2 pb-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              {/* Header */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-6 lg:p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z" />
                        </svg>
                        Your Shortlisted Universities
                      </h2>
                      <p className="mt-2 text-base lg:text-lg text-white/90">
                        {shortlistedUniversities.length > 0 
                          ? `You have ${shortlistedUniversities.length} ${shortlistedUniversities.length === 1 ? 'university' : 'universities'} in your shortlist`
                          : 'Build your perfect university collection'
                        }
                      </p>
                    </div>
                    {shortlistedUniversities.length > 0 && (
                      <div className="hidden lg:block">
                        <div className="w-20 h-20 xl:w-24 xl:h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <span className="text-2xl xl:text-3xl font-bold">{shortlistedUniversities.length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {shortlistedUniversities.length > 0 && (
                <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    href="/universities"
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Add More Universities
                  </Button>

                  <Button
                    onClick={handleExportPDF}
                    variant="primary"
                    className="flex items-center justify-center gap-2"
                    disabled={isFreePlan && !canPerformAction('exportPdf')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF {isFreePlan && '(Premium)'}
                  </Button>
                  
                  <Button
                    onClick={handleClearAllShortlisted}
                    variant="ghost"
                    className="flex items-center justify-center gap-2 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
                  </Button>
                </div>
              )}

              {/* Subscription Status Banner for Free Users */}
              {isFreePlan && shortlistedUniversities.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <h3 className="text-lg font-semibold text-amber-900">Free Plan - Limited Features</h3>
                          <p className="text-sm text-amber-700">
                            Upgrade to Premium for unlimited PDF exports and advanced features
                          </p>
                        </div>
                      </div>
                      <Button
                        href="/profile?tab=subscription"
                        variant="primary"
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm"
                      >
                        Upgrade Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-16">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {/* Universities Grid */}
              {!loading && shortlistedUniversities.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {shortlistedUniversities.map((university) => (
                    <UniversityCard
                      key={university.id}
                      university={university}
                      isSaved={true}
                      onRemove={handleRemoveFromShortlist}
                      showMatch={false}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && shortlistedUniversities.length === 0 && <EmptyState />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShortlistedUniversities;
