import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import subscriptionService from '../services/subscriptionService';

export const useSubscriptionLimits = () => {
  const { currentUser, subscriptionData } = useAuth();
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoize critical values to prevent unnecessary re-renders
  const planType = useMemo(() => subscriptionData?.planType || 'free', [subscriptionData?.planType]);
  const subscriptionLimits = useMemo(() => subscriptionData?.limits, [subscriptionData?.limits]);
  const subscriptionUsage = useMemo(() => subscriptionData?.usage, [subscriptionData?.usage]);  useEffect(() => {
    console.log('📊 Subscription data updated:', {
      planType,
      hasUsage: !!subscriptionUsage,
      hasLimits: !!subscriptionLimits
    });

    // Use limits from subscription service if available, otherwise use defaults
    let currentLimits;
    
    if (subscriptionLimits) {
      // Use limits from subscription service (which come from subscriptionTiers)
      currentLimits = subscriptionLimits;
      console.log('✅ Using limits from subscription service:', currentLimits);
    } else {
      // Fallback to hardcoded limits if subscription service doesn't provide them
      console.log('⚠️ No limits in subscription data, using fallback limits');
      const fallbackPlanLimits = {
        free: {
          pathwaysPerMonth: 1,
          uniGuideProUsage: 5, // Free users get 5 uses
          myStudyPathUsage: 0, // No access for free users
          universityComparisons: 3,
          pdfExports: 0,
          advancedFilters: false,
          analytics: false
        },
        premium: {
          pathwaysPerMonth: -1,
          uniGuideProUsage: 10, // Premium users get 10 uses
          myStudyPathUsage: -1, // Unlimited access for premium
          universityComparisons: 10,
          pdfExports: -1,
          advancedFilters: true,
          analytics: false
        },
        pro: {
          pathwaysPerMonth: -1,
          uniGuideProUsage: -1, // Unlimited access for pro
          myStudyPathUsage: -1,
          universityComparisons: -1,
          pdfExports: -1,
          advancedFilters: true,
          analytics: true
        }
      };
      currentLimits = fallbackPlanLimits[planType];    }
    
    // Ensure all usage fields are properly initialized with defaults
    const baseUsage = subscriptionUsage || {};
    const currentUsage = {
      pathwaysGenerated: baseUsage.pathwaysGenerated || 0,
      uniGuideProUsage: baseUsage.uniGuideProUsage || 0,
      myStudyPathUsage: baseUsage.myStudyPathUsage || 0,
      universityComparisons: baseUsage.universityComparisons || 0,
      pdfExports: baseUsage.pdfExports || 0
    };
    
    console.log('🎯 Setting limits and usage:', {
      planType,
      currentLimits,
      currentUsage,
      source: subscriptionLimits ? 'subscription-service' : 'fallback'
    });
    
    setLimits(currentLimits);
    setUsage(currentUsage);
    setLoading(false);  }, [planType, subscriptionLimits, subscriptionUsage]); // Use memoized values
  
  // Check if user can perform an action
  const canPerformAction = useCallback((action) => {
    // Reduced logging to prevent infinite loops
    if (action === 'useMyStudyPath') {
      console.log('🔍 canPerformAction(useMyStudyPath):', {
        planType,
        hasLimits: !!limits,
        hasUsage: !!usage
      });
    }    // Handle loading state - provide defaults for free users to prevent blocking
    if (!limits || !usage) {
      console.log('⏳ Subscription data still loading, using defaults for action:', action);
      
      // If it's a paid plan, assume they can perform the action during loading
      if (planType !== 'free') {
        console.log('✅ Paid plan detected during loading, allowing action');
        return true;
      }
      
      // For free users, provide sensible defaults during loading state
      const defaultFreeUsage = subscriptionUsage || {
        pathwaysGenerated: 0,
        uniGuideProUsage: 0,
        myStudyPathUsage: 0,
        universityComparisons: 0,
        pdfExports: 0
      };
      
      // Check specific actions for free users with default limits
      switch (action) {        case 'generatePathway':
        case 'pathway_generation':
          const canGenerateDefault = defaultFreeUsage.pathwaysGenerated < 1;
          return canGenerateDefault;          case 'useUniGuidePro':
          // Check if free users have reached their limit
          const usageLimit = planType === 'free' ? 5 : planType === 'premium' ? 10 : -1;
          const currentUsage = defaultFreeUsage.uniGuideProUsage || 0;
          const canUse = usageLimit === -1 || currentUsage < usageLimit;
          return canUse;case 'useMyStudyPath':
          // MyStudyPath is a premium feature - requires paid plan
          return false; // MyStudyPath always requires paid plan
          case 'compareUniversities':
          const canCompareDefault = defaultFreeUsage.universityComparisons < 3;
          return canCompareDefault;
          case 'exportPdf':
        case 'useAdvancedFilters':
        case 'viewAnalytics':
          return false; // These require paid plans
          default:
          return false;
      }
    }

    switch (action) {      case 'generatePathway':
      case 'pathway_generation':
        const canGeneratePathway = limits.pathwaysPerMonth === -1 || (usage.pathwaysGenerated || 0) < limits.pathwaysPerMonth;
        return canGeneratePathway;        case 'useUniGuidePro':
        // Check usage limits based on plan type
        const uniGuideLimit = limits.uniGuideProUsage;
        const uniGuideUsage = usage.uniGuideProUsage || 0;
        const canUseUniGuide = uniGuideLimit === -1 || uniGuideUsage < uniGuideLimit;
        return canUseUniGuide;        case 'useMyStudyPath':
        // MyStudyPath requires paid plan (Premium or Pro)
        const isPaidPlan = planType === 'premium' || planType === 'pro';
        return isPaidPlan;
      
      case 'compareUniversities':
        return limits.universityComparisons === -1 || (usage.universityComparisons || 0) < limits.universityComparisons;
      
      case 'exportPdf':
        return limits.pdfExports === -1 || (limits.pdfExports > 0 && (usage.pdfExports || 0) < limits.pdfExports);
      
      case 'useAdvancedFilters':
        return limits.advancedFilters;
        case 'viewAnalytics':
        return limits.analytics;
        default:
        return false;
    }
  }, [limits, usage, planType, subscriptionData?.planType]); // Add dependency array for useCallback
    // Get remaining count for a specific action
  const getRemainingCount = useCallback((action) => {
    // Handle loading state - provide defaults for free users
    if (!limits || !usage) {
      // For paid plans during loading, assume they have access
      if (planType !== 'free') {
        return Infinity;
      }

      // For free users during loading, use default limits
      const defaultUsage = subscriptionUsage || {
        pathwaysGenerated: 0,
        uniGuideProUsage: 0,
        myStudyPathUsage: 0,
        universityComparisons: 0,
        pdfExports: 0
      };

      // For paid plans during loading, assume they have access
      if (planType !== 'free') {
        return Infinity;
      }

      // For free users during loading, use default limits
      switch (action) {
        case 'generatePathway':
          return Math.max(0, 1 - defaultUsage.pathwaysGenerated);
        case 'useUniGuidePro':
          return Math.max(0, 5 - defaultUsage.uniGuideProUsage);
        case 'compareUniversities':
          return Math.max(0, 3 - defaultUsage.universityComparisons);
        default:
          return 0;
      }
    }    switch (action) {
      case 'generatePathway':
        return limits.pathwaysPerMonth === -1 ? Infinity : Math.max(0, limits.pathwaysPerMonth - (usage.pathwaysGenerated || 0));
      
      case 'useUniGuidePro':
        return limits.uniGuideProUsage === -1 ? Infinity : Math.max(0, limits.uniGuideProUsage - (usage.uniGuideProUsage || 0));
      
      case 'compareUniversities':
        return limits.universityComparisons === -1 ? Infinity : Math.max(0, limits.universityComparisons - (usage.universityComparisons || 0));
      
      case 'exportPdf':
        return limits.pdfExports === -1 ? Infinity : Math.max(0, limits.pdfExports - (usage.pdfExports || 0));
        default:
        return 0;
    }
  }, [limits, usage, planType, subscriptionUsage]); // Add dependency array for useCallback
  // Track usage for an action
  const trackUsage = useCallback(async (action) => {
    if (!currentUser) return false;

    try {
      let success = false;
        switch (action) {
        case 'generatePathway':
          success = await subscriptionService.trackPathwayGeneration(currentUser.uid);
          break;          case 'useUniGuidePro':
          // Track usage for UniGuidePro
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
      }      return success;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  }, [currentUser]); // Add dependency array for useCallback

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
  };  // Show upgrade prompt
  const showUpgradePrompt = (action, onUpgrade) => {    const actionNames = {
      generatePathway: 'generate more study abroad pathways',
      pathway_generation: 'generate more study abroad pathways',
      useUniGuidePro: 'use UniGuidePro more times',
      useMyStudyPath: 'access MyStudyAbroadPath features',
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
