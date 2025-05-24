import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData } = useAuth();

  return (
    <div className="flex h-screen bg-secondary-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <div className="bg-white shadow-sm border-b border-secondary-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden rounded-md text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="ml-4 lg:ml-0 text-2xl font-semibold text-secondary-900">Profile</h1>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-secondary-900 mb-4">User Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Display Name</label>
                    <p className="mt-1 text-sm text-secondary-900">{userData?.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Email</label>
                    <p className="mt-1 text-sm text-secondary-900">{userData?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Role</label>
                    <p className="mt-1 text-sm text-secondary-900">{userData?.role}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-secondary-500">
                    Profile management features will be implemented in future modules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
