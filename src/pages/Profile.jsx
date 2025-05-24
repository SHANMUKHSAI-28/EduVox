import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import AcademicProfileForm from '../components/university/AcademicProfileForm';
import Alert from '../components/common/Alert';
import { academicProfileService } from '../services/universityService';

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [alert, setAlert] = useState(null);
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
    { id: 'academic', name: 'Academic Profile' }
  ];  return (
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
