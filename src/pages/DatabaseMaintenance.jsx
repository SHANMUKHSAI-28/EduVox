import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { migrateUniversityVerificationStatus, checkVerificationStatus, makeUserAdmin } from '../utils/migrationUtils';
import { useAuth } from '../contexts/AuthContext';

const DatabaseMaintenance = () => {
  const { currentUser, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [verificationStats, setVerificationStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [adminSetupEmail, setAdminSetupEmail] = useState('');
  const [adminSetupUid, setAdminSetupUid] = useState('');

  useEffect(() => {
    loadVerificationStats();
  }, []);

  const loadVerificationStats = async () => {
    try {
      const stats = await checkVerificationStatus();
      setVerificationStats(stats);
    } catch (error) {
      console.error('Failed to load verification stats:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load verification statistics'
      });
    }
  };

  const handleMigration = async () => {
    if (!window.confirm('Are you sure you want to run the verification status migration? This will update all universities without verification status to be marked as verified.')) {
      return;
    }

    setIsLoading(true);
    setAlert(null);
    
    try {
      const result = await migrateUniversityVerificationStatus();
      setMigrationResult(result);
      
      if (result.success) {
        setAlert({
          type: 'success',
          message: result.message
        });
        // Reload stats after migration
        await loadVerificationStats();
      } else {
        setAlert({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setAlert({
        type: 'error',
        message: `Migration failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  const clearResults = () => {
    setMigrationResult(null);
    setAlert(null);
  };

  const handleAdminSetup = async () => {
    if (!adminSetupEmail || !adminSetupUid) {
      setAlert({
        type: 'error',
        message: 'Please provide both email and Firebase Auth UID'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to grant admin privileges to ${adminSetupEmail}?`)) {
      return;
    }

    setIsLoading(true);
    setAlert(null);    try {
      // Use the admin setup function from migrationUtils
      const result = await makeUserAdmin(adminSetupEmail, adminSetupUid);
      
      if (result.success) {
        setAlert({
          type: 'success',
          message: result.message
        });
        setAdminSetupEmail('');
        setAdminSetupUid('');
      } else {
        setAlert({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Admin setup failed:', error);
      setAlert({
        type: 'error',
        message: `Admin setup failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Database Maintenance</h2>
        
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-6"
          />
        )}

        {/* Verification Status Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">University Verification Status</h3>
          
          {verificationStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{verificationStats.total}</div>
                <div className="text-sm text-gray-600">Total Universities</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{verificationStats.verified}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{verificationStats.unverified}</div>
                <div className="text-sm text-gray-600">Unverified</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{verificationStats.needsMigration}</div>
                <div className="text-sm text-gray-600">Need Migration</div>
              </div>
            </div>
          ) : (
            <LoadingSpinner />
          )}
          
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={loadVerificationStats}
              variant="secondary"
              disabled={isLoading}
            >
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Migration Tools */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Verification Status Migration</h3>
          <p className="text-gray-600 mb-4">
            This tool will add verification status to existing universities that don't have it. 
            All existing universities will be marked as verified by default.
          </p>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleMigration}
              disabled={isLoading || (verificationStats && verificationStats.needsMigration === 0)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Running Migration...</span>
                </>
              ) : (
                'Run Verification Migration'
              )}
            </Button>
            
            {migrationResult && (
              <Button
                onClick={clearResults}
                variant="secondary"
              >
                Clear Results
              </Button>
            )}
          </div>

          {verificationStats && verificationStats.needsMigration === 0 && (
            <p className="text-green-600 text-sm mt-2">
              ✅ All universities already have verification status
            </p>
          )}
        </div>        {/* Migration Results */}
        {migrationResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Migration Results</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{migrationResult.updated}</div>
                <div className="text-sm text-gray-600">Universities Updated</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{migrationResult.skipped}</div>
                <div className="text-sm text-gray-600">Universities Skipped</div>
              </div>
            </div>

            {migrationResult.results && migrationResult.results.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                <h4 className="font-medium mb-2">Detailed Results:</h4>
                <div className="space-y-1">
                  {migrationResult.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="font-medium">{result.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.action === 'updated' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.action === 'updated' ? 'Updated' : `Skipped (${result.currentStatus})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin User Setup */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Admin User Setup</h3>
          <p className="text-gray-600 mb-4">
            Grant admin privileges to users. You'll need their email and Firebase Auth UID.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={adminSetupEmail}
                onChange={(e) => setAdminSetupEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firebase Auth UID
              </label>
              <input
                type="text"
                value={adminSetupUid}
                onChange={(e) => setAdminSetupUid(e.target.value)}
                placeholder="Firebase Auth UID (from Firebase Console)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleAdminSetup}
                disabled={isLoading || !adminSetupEmail || !adminSetupUid}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Setting up Admin...</span>
                  </>
                ) : (
                  'Grant Admin Privileges'
                )}
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <strong>How to find Firebase Auth UID:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Go to Firebase Console → Authentication → Users</li>
                <li>Find the user by email</li>
                <li>Copy their UID from the User UID column</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseMaintenance;
