import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import subscriptionService from '../services/subscriptionService';

export const useSubscriptionLimits = () => {
  const { currentUser, subscriptionData } = useAuth();
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const planType = subscriptionData?.planType || 'free';
      // Set limits based on plan type
    const planLimits = {
      free: {
        pathwaysPerMonth: 1, // Keep original pathway generation limit
        uniGuideProUsage: 3, // Allow 3 free UniGuidePro uses
        myStudyPathUsage: 0, // Require paid plan for MyStudyAbroadPath
        universityComparisons: 3,
        pdfExports: 0,
        advancedFilters: false,
        analytics: false
      },
      premium: {
        pathwaysPerMonth: -1, // unlimited
        uniGuideProUsage: -1, // unlimited UniGuidePro
        myStudyPathUsage: -1, // unlimited MyStudyAbroadPath
        universityComparisons: 10,
        pdfExports: -1, // unlimited
        advancedFilters: true,
        analytics: false
      },
      pro: {
        pathwaysPerMonth: -1, // unlimited
        uniGuideProUsage: -1, // unlimited UniGuidePro
        myStudyPathUsage: -1, // unlimited MyStudyAbroadPath
        universityComparisons: -1, // unlimited
        pdfExports: -1, // unlimited
        advancedFilters: true,
        analytics: true
      }
    };    setLimits(planLimits[planType]);
    setUsage(subscriptionData?.usage || {
      pathwaysGenerated: 0,
      uniGuideProUsage: 0,
      myStudyPathUsage: 0,
      universityComparisons: 0,
      pdfExports: 0
    });
    setLoading(false);
  }, [subscriptionData]);
  // Check if user can perform an action
  const canPerformAction = (action) => {
    if (!limits || !usage) return false;

    switch (action) {
      case 'generatePathway':
        return limits.pathwaysPerMonth === -1 || usage.pathwaysGenerated < limits.pathwaysPerMonth;
      
      case 'useUniGuidePro':
        return limits.uniGuideProUsage === -1 || usage.uniGuideProUsage < limits.uniGuideProUsage;
      
      case 'useMyStudyPath':
        return limits.myStudyPathUsage === -1 || usage.myStudyPathUsage < limits.myStudyPathUsage;
      
      case 'compareUniversities':
        return limits.universityComparisons === -1 || usage.universityComparisons < limits.universityComparisons;
      
      case 'exportPdf':
        return limits.pdfExports === -1 || (limits.pdfExports > 0 && usage.pdfExports < limits.pdfExports);
      
      case 'useAdvancedFilters':
        return limits.advancedFilters;
      
      case 'viewAnalytics':
        return limits.analytics;
      
      default:
        return false;
    }
  };

  // Get remaining count for a specific action
  const getRemainingCount = (action) => {
    if (!limits || !usage) return 0;

    switch (action) {
      case 'generatePathway':
        return limits.pathwaysPerMonth === -1 ? Infinity : Math.max(0, limits.pathwaysPerMonth - usage.pathwaysGenerated);
      
      case 'compareUniversities':
        return limits.universityComparisons === -1 ? Infinity : Math.max(0, limits.universityComparisons - usage.universityComparisons);
      
      case 'exportPdf':
        return limits.pdfExports === -1 ? Infinity : Math.max(0, limits.pdfExports - usage.pdfExports);
      
      default:
        return 0;
    }
  };

  // Track usage for an action
  const trackUsage = async (action) => {
    if (!currentUser) return false;

    try {
      let success = false;
        switch (action) {
        case 'generatePathway':
          success = await subscriptionService.trackPathwayGeneration(currentUser.uid);
          break;
        
        case 'useUniGuidePro':
          success = await subscriptionService.trackUniGuideProUsage(currentUser.uid);
          break;
        
        case 'useMyStudyPath':
          success = await subscriptionService.trackMyStudyPathUsage(currentUser.uid);
          break;
        
        case 'compareUniversities':
          success = await subscriptionService.trackUniversityComparison(currentUser.uid);
          break;
        
        case 'exportPdf':
          success = await subscriptionService.trackPdfExport(currentUser.uid);
          break;
        
        default:
          return false;
      }      if (success) {
        // Update local usage state
        const usageKey = {
          'generatePathway': 'pathwaysGenerated',
          'useUniGuidePro': 'uniGuideProUsage',
          'useMyStudyPath': 'myStudyPathUsage',
          'compareUniversities': 'universityComparisons',
          'exportPdf': 'pdfExports'
        }[action];
        
        if (usageKey) {
          setUsage(prev => ({
            ...prev,
            [usageKey]: (prev[usageKey] || 0) + 1
          }));
        }
      }

      return success;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  };

  // Get usage percentage for display
  const getUsagePercentage = (action) => {
    if (!limits || !usage) return 0;

    const limit = limits[action === 'generatePathway' ? 'pathwaysPerMonth' : 
                         action === 'compareUniversities' ? 'universityComparisons' : 
                         'pdfExports'];
    
    if (limit === -1) return 0; // unlimited

    const used = usage[action === 'generatePathway' ? 'pathwaysGenerated' : 
                      action === 'compareUniversities' ? 'universityComparisons' : 
                      'pdfExports'] || 0;

    return Math.min(100, (used / limit) * 100);
  };

  // Show upgrade prompt
  const showUpgradePrompt = (action, onUpgrade) => {
    const actionNames = {
      generatePathway: 'generate more study abroad pathways',
      compareUniversities: 'compare more universities',
      exportPdf: 'export documents as PDF',
      useAdvancedFilters: 'use advanced search filters',
      viewAnalytics: 'access analytics dashboard'
    };

    const message = `You've reached your ${subscriptionData?.planType || 'free'} plan limit. Upgrade to ${actionNames[action]}.`;
    
    if (window.confirm(`${message}\n\nWould you like to upgrade now?`)) {
      if (onUpgrade) onUpgrade();
    }
  };

  return {
    limits,
    usage,
    loading,
    canPerformAction,
    getRemainingCount,
    trackUsage,
    getUsagePercentage,
    showUpgradePrompt,
    planType: subscriptionData?.planType || 'free'
  };
};
