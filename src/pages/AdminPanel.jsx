import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import ManageUniversities from './ManageUniversities';
import DatabaseMaintenance from './DatabaseMaintenance';

const AdminPanel = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const navigate = useNavigate();
  const modules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Overview of system statistics and recent activities'
    },
    {
      id: 'universities',
      name: 'Manage Universities',
      description: 'Add, update, and verify university information'
    },
    {
      id: 'database',
      name: 'Database Maintenance',
      description: 'Run migrations and maintain database integrity'
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure system-wide settings and preferences'
    }
  ];
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'universities':
        return <ManageUniversities />;
      case 'database':
        return <DatabaseMaintenance />;
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">System Settings</h2>
            <p>System settings coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveModule(module.id)}
                >
                  <h3 className="text-xl font-semibold mb-2">{module.name}</h3>
                  <p className="text-gray-600">{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              {activeModule !== 'dashboard' && (
                <Button
                  onClick={() => setActiveModule('dashboard')}
                  variant="secondary"
                >
                  Back to Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderModuleContent()}
      </main>
    </div>
  );
};

export default AdminPanel;
