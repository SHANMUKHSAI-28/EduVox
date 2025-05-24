import React, { useState } from 'react';
import { Search, Target, Heart, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from '../../components/layout/Sidebar';
import { Button } from '../../components/common/Button';
import { UniversityList } from './UniversityList';
import { UniversityMatching } from './UniversityMatching';

type TabType = 'explore' | 'matching' | 'saved';

export const Universities: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'explore', label: 'Explore Universities', icon: Search },
    { id: 'matching', label: 'Smart Matching', icon: Target },
    { id: 'saved', label: 'Saved Universities', icon: Heart, requireAuth: true },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <LayoutDashboard className="h-6 w-6" />
              </button>
              <h1 className="ml-4 lg:ml-0 text-2xl font-semibold text-gray-900">
                Universities
              </h1>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                if (tab.requireAuth && !currentUser) return null;
                
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      flex items-center py-4 border-b-2 font-medium text-sm transition-colors
                      ${isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'explore' && <UniversityList showSavedOnly={false} />}
          {activeTab === 'matching' && <UniversityMatching />}
          {activeTab === 'saved' && currentUser && <UniversityList showSavedOnly={true} />}
          
          {/* Show login prompt for saved universities if not authenticated */}
          {activeTab === 'saved' && !currentUser && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view saved universities</h3>
                <p className="text-gray-500 mb-4">
                  Create an account to save universities and track your application progress.
                </p>
                <Button onClick={() => window.location.href = '/auth/login'}>
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
