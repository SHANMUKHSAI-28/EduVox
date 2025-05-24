import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/common/Sidebar';
import AdBanner from '../components/ads/AdBanner';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData } = useAuth();

  const stats = [
    {
      name: 'Universities Shortlisted',
      value: '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-blue-500'
    },
    {
      name: 'Applications Submitted',
      value: '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-green-500'
    },
    {
      name: 'Profile Completion',
      value: '20%',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-yellow-500'
    },
    {
      name: 'Consultant Sessions',
      value: '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-purple-500'
    }
  ];

  const quickActions = [
    {
      name: 'Complete Profile',
      description: 'Add your academic details and preferences',
      href: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-primary-500'
    },
    {
      name: 'Find Universities',
      description: 'Discover universities that match your criteria',
      href: '/universities',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'bg-green-500'
    }
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
                Dashboard
              </h1>
            </div>
          </div>
        </div>        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto">
          <div className="pt-2 pb-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">              {/* Welcome section */}
              <div className="mb-4">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-6 lg:p-8 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold">
                        Welcome back, {userData?.displayName || 'User'}! 🎓
                      </h2>
                      <p className="mt-2 text-base lg:text-lg text-white/90">
                        Here's what's happening with your educational journey today.
                      </p>
                    </div>
                    <div className="hidden lg:block">
                      <div className="w-20 h-20 xl:w-24 xl:h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-10 h-10 xl:w-12 xl:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>{/* Stats grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {stats.map((stat, index) => (
                  <div key={stat.name} className="group">
                    <div className="bg-white/70 backdrop-blur-xl overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <div className="p-4 lg:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`${stat.color} rounded-2xl p-3 lg:p-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              {stat.icon}
                            </div>
                          </div>
                          <div className="ml-4 lg:ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-xs lg:text-sm font-semibold text-secondary-600 truncate">
                                {stat.name}
                              </dt>
                              <dd className="text-xl lg:text-2xl font-bold text-secondary-900 mt-1">
                                {stat.value}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-primary-50 to-accent-50 px-4 lg:px-6 py-2 lg:py-3">
                        <div className="text-xs text-secondary-500 font-medium">
                          {index === 0 && "Start exploring universities"}
                          {index === 1 && "Ready to apply?"}
                          {index === 2 && "Complete your profile"}
                          {index === 3 && "Book a session"}
                        </div>
                      </div>
                    </div>
                  </div>                ))}
              </div>              {/* AdSense Banner */}
              <div className="mb-6">
                <AdBanner 
                  slot={import.meta.env.VITE_ADSENSE_BANNER_SLOT}
                  size="large" 
                  format="horizontal"
                />
              </div>

              {/* Quick actions */}
              <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 mb-6">
                <div className="px-4 lg:px-8 py-4 lg:py-6">
                  <h3 className="text-xl lg:text-2xl font-bold text-secondary-900 mb-4 lg:mb-6 flex items-center gap-3">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-4 lg:gap-6 sm:grid-cols-2">
                    {quickActions.map((action) => (
                      <div
                        key={action.name}
                        className="group relative rounded-2xl border-2 border-secondary-200 bg-white/50 backdrop-blur-sm px-4 lg:px-8 py-4 lg:py-6 shadow-lg hover:border-primary-300 hover:shadow-xl hover:scale-105 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 cursor-pointer transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3 lg:space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`${action.color} rounded-2xl p-3 lg:p-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              {action.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href={action.href} className="focus:outline-none">
                              <span className="absolute inset-0" aria-hidden="true" />
                              <p className="text-base lg:text-lg font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                                {action.name}
                              </p>
                              <p className="text-sm text-secondary-600 mt-1">
                                {action.description}
                              </p>
                            </a>                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-secondary-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>              </div>

              {/* AdSense Article Ad */}
              <div className="mb-6">
                <AdBanner 
                  slot={import.meta.env.VITE_ADSENSE_ARTICLE_SLOT}
                  size="medium" 
                  format="auto"
                />
              </div>

              {/* Recent activity placeholder */}
              <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
                <div className="px-4 lg:px-8 py-4 lg:py-6">
                  <h3 className="text-xl lg:text-2xl font-bold text-secondary-900 mb-4 lg:mb-6 flex items-center gap-3">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-accent-500 to-primary-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Recent Activity
                  </h3>
                  <div className="text-center py-12 lg:py-16">
                    <div className="mx-auto w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                      <svg className="w-10 h-10 lg:w-12 lg:h-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>                    <h3 className="text-lg lg:text-xl font-bold text-secondary-900 mb-2">No recent activity</h3>
                    <p className="text-sm lg:text-base text-secondary-600 max-w-md mx-auto leading-relaxed">
                      Get started by completing your profile or searching for universities that match your dreams.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
