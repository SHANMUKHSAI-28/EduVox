import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import AcademicProfileForm from '../components/university/AcademicProfileForm';
import UsageDashboard from '../components/subscription/UsageDashboard';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import Alert from '../components/common/Alert';
import { academicProfileService } from '../services/universityService';

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [alert, setAlert] = useState(null);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const { userData, currentUser } = useAuth();

  useEffect(() => {
    // Check if URL contains hash for academic tab
    if (window.location.hash === '#academic') {
      setActiveTab('academic');
    }
  }, []);

  const handleProfileSave = (profileData) => {
    setAlert({ type: 'success', message: 'Academic profile updated successfully!' });
    setTimeout(() => setAlert(null), 3000);
  };
  const tabs = [
    { id: 'basic', name: 'Basic Info' },
    { id: 'academic', name: 'Academic Profile' },
    { id: 'subscription', name: 'Subscription' }
  ];return (
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
                Profile
              </h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-white/20">
          <div className="px-3 sm:px-4 lg:px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
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
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">              {activeTab === 'basic' && (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 lg:p-8 border border-white/20 shadow-2xl mb-4">
                  <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-6 lg:mb-8">
                    Basic Information
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">Display Name</label>
                        <p className="p-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900">
                          {userData?.displayName || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">Email</label>
                        <p className="p-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900">
                          {userData?.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">Role</label>
                        <p className="p-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900 capitalize">
                          {userData?.role}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">Member Since</label>
                        <p className="p-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-900">
                          {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 lg:mt-8 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                      <p className="text-sm text-primary-700">
                        <strong>Note:</strong> Basic profile editing features will be available in future updates. 
                        For now, you can manage your academic profile in the Academic Profile tab.
                      </p>
                    </div>
                  </div>
                </div>
              )}              {activeTab === 'academic' && (
                <div className="mb-4">
                  <AcademicProfileForm onSave={handleProfileSave} />
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Usage Dashboard */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 lg:p-8 border border-white/20 shadow-2xl">
                    <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-6 lg:mb-8">
                      Usage Dashboard
                    </h2>
                    <UsageDashboard />
                  </div>

                  {/* Current Subscription */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-4 lg:p-8 border border-white/20 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4 sm:mb-0">
                        Subscription Management
                      </h2>
                      <button
                        onClick={() => setShowSubscriptionPlans(true)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl hover:from-primary-700 hover:to-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Manage Plans
                      </button>
                    </div>

                    {/* Current Plan Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl border border-primary-100">
                        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Current Plan</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-secondary-600">Plan:</span>
                            <span className="font-medium text-secondary-800 capitalize">
                              {userData?.subscription?.plan || 'Free'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-secondary-600">Status:</span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              userData?.subscription?.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : userData?.subscription?.status === 'past_due'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userData?.subscription?.status || 'N/A'}
                            </span>
                          </div>
                          {userData?.subscription?.currentPeriodEnd && (
                            <div className="flex justify-between items-center">
                              <span className="text-secondary-600">Next Billing:</span>
                              <span className="font-medium text-secondary-800">
                                {new Date(userData.subscription.currentPeriodEnd).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl border border-accent-100">
                        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Plan Benefits</h3>
                        <div className="space-y-2">
                          {userData?.subscription?.plan === 'pro' ? (
                            <>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Unlimited university comparisons
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Unlimited pathway generations
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Priority AI support
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Advanced filters & analytics
                              </div>
                            </>
                          ) : userData?.subscription?.plan === 'premium' ? (
                            <>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                10 university comparisons/month
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Unlimited pathway generations
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                PDF exports included
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                3 university comparisons/month
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                1 pathway generation/month
                              </div>
                              <div className="flex items-center text-sm text-secondary-600">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Basic support
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Subscription Plans Modal */}
      {showSubscriptionPlans && (
        <SubscriptionPlans 
          isOpen={showSubscriptionPlans}
          onClose={() => setShowSubscriptionPlans(false)}
        />
      )}
    </div>
  );
};

export default Profile;
