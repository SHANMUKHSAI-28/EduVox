import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

const Navbar = () => {
  const { currentUser, userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <nav className="navbar sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-secondary-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient-primary group-hover:scale-105 transition-transform duration-200">
                  EduVox
                </h1>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link 
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
                </Link>
                
                {/* User Info */}
                <div className="flex items-center space-x-4">
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
