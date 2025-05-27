import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Universities from './pages/Universities';
import ShortlistedUniversities from './pages/ShortlistedUniversities';
import AdminPanel from './pages/AdminPanel';
import UniGuidePro from './components/features/UniGuidePro/index';
import PathwayHistory from './components/features/PathwayHistory';

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Loading UniGuidePro</h2>
          <p className="text-secondary-600">Please wait while we set up your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <div className="pt-16"> {/* Add top padding to account for fixed navbar */}
        <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={currentUser ? <Navigate to="/dashboard" replace /> : <Signup />} 
        />
        <Route 
          path="/forgot-password" 
          element={currentUser ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
        />

        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/universities" 
          element={
            <ProtectedRoute>
              <Universities />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shortlisted" 
          element={
            <ProtectedRoute>
              <ShortlistedUniversities />
            </ProtectedRoute>
          } 
        />        <Route 
          path="/uniguidepro" 
          element={
            <ProtectedRoute>
              <UniGuidePro />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pathway-history" 
          element={
            <ProtectedRoute>
              <PathwayHistory />
            </ProtectedRoute>
          } 
        />        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
