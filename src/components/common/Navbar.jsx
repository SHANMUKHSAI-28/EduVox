import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionStatus from '../subscription/SubscriptionStatus';
import Button from './Button';

const Navbar = () => {
  const { currentUser, userData, logout } = useAuth();
  const [isStudyAbroadOpen, setIsStudyAbroadOpen] = useState(false);
  const dropdownRef = useRef(null);
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStudyAbroadOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleStudyAbroadDropdown = () => {
    setIsStudyAbroadOpen(!isStudyAbroadOpen);
  };

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-secondary-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient-primary group-hover:scale-105 transition-transform duration-200">
                  UniGuidePro
                </h1>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {currentUser ? (
              <>                <Link 
                  to="/dashboard" 
                  className="text-secondary-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/universities" 
                  className="text-secondary-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50"
                >
                  Universities
                </Link>                {/* Study Abroad Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleStudyAbroadDropdown}
                    className="text-secondary-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50 flex items-center"
                  >
                    Study Abroad
                    <svg 
                      className={`w-4 h-4 ml-1 transition-transform duration-200 ${isStudyAbroadOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 z-50 ${
                    isStudyAbroadOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
                  }`}>
                    <div className="py-1">                      <Link
                        to="/uniguidepro"
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsStudyAbroadOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          UniGuidePro
                        </div>
                        <div className="text-xs text-secondary-500 ml-7">Personalized pathway</div>
                      </Link>
                      <Link
                        to="/uniguidepro"
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsStudyAbroadOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          UniGuidePro
                        </div>
                        <div className="text-xs text-secondary-500 ml-7">General pathway generator</div>
                      </Link>
                      <Link
                        to="/pathway-history"
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsStudyAbroadOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          History
                        </div>
                        <div className="text-xs text-secondary-500 ml-7">View past pathways</div>
                      </Link>
                    </div>
                  </div>
                </div>
                <Link 
                  to="/profile" 
                  className="text-secondary-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary-50"
                >
                  Profile
                </Link>
                
                {/* Admin Link - Only show for admin users */}
                {userData?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-accent-700 hover:text-accent-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent-50 border border-accent-200"
                  >
                    Admin Panel
                  </Link>
                )}
                  {/* User Info */}
                <div className="flex items-center space-x-4">
                  {/* Subscription Status */}
                  <SubscriptionStatus />
                  
                  <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100">
                    {userData?.photoURL ? (
                      <img 
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm" 
                        src={userData.photoURL} 
                        alt={userData.displayName || 'User'} 
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
                        <span className="text-sm font-medium text-white">
                          {(userData?.displayName || userData?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-secondary-900">
                        {userData?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-secondary-500 capitalize">
                        {userData?.role || 'Student'}
                      </p>
                    </div>
                  </div>
                  
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      Profile
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="border-danger-300 text-danger-600 hover:bg-danger-600 hover:text-white hover:border-danger-600"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="gradient" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
