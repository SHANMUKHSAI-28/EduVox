import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';

const UsageDashboard = () => {
  const { subscriptionData } = useAuth();
  const { limits, usage, planType, getUsagePercentage } = useSubscriptionLimits();

  if (!subscriptionData || !limits || !usage) return null;

  const usageItems = [
    {
      name: 'Study Abroad Pathways',
      current: usage.pathwaysGenerated || 0,
      limit: limits.pathwaysPerMonth,
      icon: '🗺️'
    },
    {
      name: 'University Comparisons',
      current: usage.universityComparisons || 0,
      limit: limits.universityComparisons,
      icon: '⚖️'
    },
    {
      name: 'PDF Exports',
      current: usage.pdfExports || 0,
      limit: limits.pdfExports,
      icon: '📄'
    }
  ];

  const formatLimit = (limit) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Usage</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          planType === 'pro' ? 'bg-purple-100 text-purple-800' :
          planType === 'premium' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan
        </span>
      </div>

      <div className="space-y-4">
        {usageItems.map((item, index) => {
          const percentage = item.limit === -1 ? 0 : Math.min(100, (item.current / item.limit) * 100);
          
          return (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">{item.icon}</span>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {item.current} / {formatLimit(item.limit)}
                </span>
              </div>
              
              {item.limit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  ></div>
                </div>
              )}
              
              {item.limit === -1 && (
                <div className="text-sm text-green-600 font-medium">✨ Unlimited</div>
              )}
              
              {item.limit !== -1 && item.current >= item.limit && (
                <div className="text-sm text-red-600 font-medium mt-1">
                  ⚠️ Limit reached for this month
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Access Status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Feature Access</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${limits.advancedFilters ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-700">Advanced Filters</span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${limits.analytics ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-700">Analytics Dashboard</span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${limits.pdfExports !== 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-700">PDF Exports</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
            <span className="text-sm text-gray-700">Priority Support</span>
          </div>
        </div>
      </div>

      {/* Reset Information */}
      {subscriptionData.usageResetDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Usage resets on: {' '}
            <span className="font-medium">
              {new Date(subscriptionData.usageResetDate.seconds * 1000).toLocaleDateString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default UsageDashboard;
