import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../common/Button'
import { GraduationCap, Menu, X, User, LogOut } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">EduVox</span>
            </Link>
          </div>

          {/* Navigation links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/universities"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Universities
                </Link>
                
                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{profile?.full_name || 'Profile'}</span>
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Button as={Link} to="/auth/register" size="sm">
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/universities"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Universities
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/auth/login"
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="block px-3 py-2 text-primary-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
