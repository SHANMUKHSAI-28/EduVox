import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { academicProfileService } from '../../services/universityService';
import studyAbroadService from '../../services/studyAbroadService';
import { generateProfileHash, shouldUpdatePathway, ONLY_UPDATE_ON_PROFILE_CHANGE } from '../../utils/pathwayUpdateDetector';
import SubscriptionPlans from '../subscription/SubscriptionPlans';
import Button from '../common/Button';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaUser, FaGraduationCap, FaDollarSign, FaGlobe, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaSync, FaBell, FaCrown, FaInfoCircle, FaListUl, FaFlag, FaFileAlt } from 'react-icons/fa';

const MyStudyAbroadPath = () => {
  const { currentUser } = useAuth();  const { 
    canPerformAction, 
    getRemainingCount, 
    trackUsage, 
    showUpgradePrompt, 
    planType,
    limits,
    usage,
    loading: subscriptionLoading 
  } = useSubscriptionLimits();
  const [loading, setLoading] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);  const [userProfile, setUserProfile] = useState(null);
  const [pathway, setPathway] = useState(null);
  const [alert, setAlert] = useState(null);
  const [activeStep, setActiveStep] = useState(null);  const [lastProfileUpdate, setLastProfileUpdate] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);  const [profileHash, setProfileHash] = useState(null); // Track profile changes
  const profileHashKey = `profile-hash-${currentUser?.uid}`;
    // Memoize permission check to prevent infinite re-renders
  const canUseMyStudyPath = useMemo(() => {
    if (subscriptionLoading) return false;
    return canPerformAction('useMyStudyPath');
  }, [canPerformAction, planType, subscriptionLoading]);

  // Effect to load user profile and pathway on mount
  useEffect(() => {
    if (currentUser && !subscriptionLoading && !userProfile) {
      loadUserProfile();
    }
  }, [currentUser, subscriptionLoading, userProfile]);

  // Load user profile function (no useCallback to prevent circular dependencies)
  const loadUserProfile = async () => {
    try {
      const profile = await academicProfileService.getAcademicProfile(currentUser.uid);
      setUserProfile(profile);
      
      if (profile && isProfileComplete(profile)) {
        // Generate hash of current profile preferences
        const currentProfileHash = generateProfileHash(profile);        

        // Check subscription before loading existing pathway
        if (canUseMyStudyPath) {
          // Only check for selected pathway or profile changes if needed
          if (!pathway || (profileHash && profileHash !== currentProfileHash)) {
            console.log('🔄 Profile preferences changed or first load, checking for updates...');
              // Check if user has selected a pathway from UniGuidePro
            const selectedPathway = await studyAbroadService.getSelectedPathway(currentUser.uid);
            if (selectedPathway) {
              console.log('📋 Found selected pathway from UniGuidePro, generating detailed analysis...');
              // Generate detailed AI-powered analysis
              await generateDetailedAnalysis(selectedPathway, profile);
              setProfileHash(currentProfileHash);
              return;
            } else {
              console.log('📋 No selected pathway from UniGuidePro - proceeding with existing pathway logic');
            }
            // Try to load existing pathway or generate new one
            await loadExistingPathway(profile, currentProfileHash !== profileHash);
          } else {
            console.log('✅ Profile unchanged, using existing pathway');
            if (!pathway) {
              // First load but no pathway exists
              await loadExistingPathway(profile, false);
            } else {
              setAlert({
                type: 'info',
                message: 'Your saved study abroad pathway has been loaded.'
              });
            }
          }
          
          // Update profile hash after processing
          setProfileHash(currentProfileHash);
        } else {
          // User doesn't have access, show upgrade prompt
          console.log('❌ MyStudyPath: User cannot access existing pathway, subscription required');
          setAlert({
            type: 'warning',
            message: 'Upgrade to Premium to access AI-powered detailed study abroad analysis.'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load your profile. Please try again.'
      });    
    } finally {
      // Only set loading to false after all async operations are complete      
      setLoading(false);
    }
  };
  const loadExistingPathway = async (profile, forceRefresh = false) => {
    try {
      console.log('🔍 Loading existing pathway for user:', currentUser.uid);
      // Try to get existing user pathway
      let existingPathway;
      try {
        existingPathway = await studyAbroadService.getUserPathway(currentUser.uid);
        console.log('📊 Existing pathway:', existingPathway);
      } catch (error) {
        if (error.message && error.message.includes('Missing or insufficient permissions')) {
          console.warn('⚠️ Firebase permission error, falling back to local storage');
          // Try to get from localStorage as fallback
          const localPathway = localStorage.getItem(`pathway_${currentUser.uid}`);
          if (localPathway) {
            existingPathway = JSON.parse(localPathway);
            console.log('📊 Using cached pathway from localStorage:', existingPathway);
          }
        } else {
          throw error; // Re-throw if it's not a permissions error
        }
      }
      
      if (existingPathway) {
        // Only check for admin updates if forced refresh or no recent check
        if (forceRefresh) {
          console.log('🔄 Force refresh requested due to profile changes');
          // Check if pathway needs refresh due to admin updates
          const refreshedPathway = await studyAbroadService.checkAndRefreshPathway(currentUser.uid, existingPathway);
          console.log('🔄 Refresh check result:', refreshedPathway);
          
          if (refreshedPathway && refreshedPathway.success && refreshedPathway.pathway) {
            console.log('✅ Setting refreshed pathway');
            setPathway(refreshedPathway.pathway);
            setAlert({
              type: 'success',
              message: '✨ Your pathway has been updated based on your profile changes!',
              icon: <FaSync />
            });          
          } else {
            console.log('✅ Setting existing pathway (no admin updates found)');
            setPathway(existingPathway);
            console.log('🎯 Pathway state updated:', existingPathway);
            setAlert({
              type: 'info',
              message: 'Your saved study abroad pathway has been loaded.'
            });
          }
        } else {
          console.log('✅ Loading existing pathway without refresh check');
          setPathway(existingPathway);
          console.log('🎯 Pathway state updated:', existingPathway);
          setAlert({
            type: 'info',
            message: 'Your saved study abroad pathway has been loaded.'
          });
        }      
      } else {
        console.log('❌ No existing pathway found, generating new one');
        // Auto-generate pathway if profile is complete but no pathway exists
        await generatePersonalizedPath(profile);
      }
    } catch (error) {
      console.error('Error loading existing pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load your pathway. Please try again.'
      });
    }
  };

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    
    const requiredFields = [
      'full_name',
      'nationality',
      'education_level',
      'preferred_countries',
      'preferred_fields_of_study',
      'target_intake',
      'target_year'
    ];

    return requiredFields.every(field => {
      const value = profile[field];
      return value && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
    });
  };  const generatePersonalizedPath = async (profile = userProfile) => {
    if (!profile) return;    // Debug logging
    console.log('📚 MyStudyAbroadPath generatePersonalizedPath - Debug Info:', {
      limits,
      usage,
      planType,
      canUseMyStudyPath: canUseMyStudyPath
    });// Check subscription limits for MyStudyPath usage
    if (!canUseMyStudyPath) {
      console.log('❌ MyStudyPath: Cannot perform action, showing upgrade prompt');
      showUpgradePrompt('useMyStudyPath', () => setShowUpgradeModal(true));
      return;
    }

    console.log('✅ MyStudyPath: Can perform action, proceeding...');
    console.log('🚀 Generating personalized path for profile:', profile);
    setGeneratingPath(true);
    setAlert({
      type: 'info',
      message: 'Generating comprehensive AI-powered study abroad pathway...',
      icon: <FaSync className="animate-spin" />
    });
    
    try {
      // Track usage before generating
      const tracked = await trackUsage('useMyStudyPath');
      if (!tracked) {
        setAlert({
          type: 'error',
          message: 'Failed to track usage. Please try again.'
        });
        setGeneratingPath(false);
        return;
      }

      // Import PathwayScrapingService directly as we need to use the same AI generation approach as UniGuidePro
      const pathwayScrapingService = (await import('../../services/pathwayScrapingService.js')).default;
      
      // Create detailed profile for AI analysis - same approach as UniGuidePro
      const detailedProfile = {
        country: profile.preferred_countries?.[0] || 'USA',
        course: profile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: profile.education_level || 'Bachelor',
        nationality: profile.nationality || 'Indian',
        budgetRange: {
          name: profile.budget_min && profile.budget_max ? 
            (profile.budget_max > 50000 ? 'High' : profile.budget_max > 25000 ? 'Medium' : 'Low') : 'Medium',
          min: profile.budget_min || 25000,
          max: profile.budget_max || 75000
        }
      };

      console.log('📋 Detailed profile for comprehensive AI analysis:', detailedProfile);
      
      // Generate comprehensive pathway using PathwayScrapingService AI function - same approach as in generateDetailedAnalysis
      const detailedPathwayData = await pathwayScrapingService.generatePathwayWithAI(detailedProfile);
      
      if (detailedPathwayData) {
        // Transform the AI response to match our pathway structure
        const detailedPathway = {
          id: `mystudypath_${Date.now()}`,
          userId: currentUser.uid,
          country: detailedProfile.country,
          course: detailedProfile.course,
          academicLevel: detailedProfile.academicLevel,
          type: 'detailed_ai_analysis',
          source: 'mystudypath_ai',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          
          // Universities from AI response
          universities: detailedPathwayData.universities || [],
          
          // Convert timeline to our step format
          steps: detailedPathwayData.timeline ? detailedPathwayData.timeline.map((timelineItem, index) => ({
            step: index + 1,
            title: timelineItem.month || `Step ${index + 1}`,
            description: timelineItem.tasks?.join(', ') || 'Complete tasks for this phase',
            duration: '1 month',
            status: 'pending',
            tasks: timelineItem.tasks || [],
            priority: timelineItem.priority || 'medium',
            documents: timelineItem.documents || 'Review required documents'
          })) : [],
          
          // Additional AI data
          documents: detailedPathwayData.documents || [],
          visaRequirements: detailedPathwayData.visaRequirements || {},
          scholarships: detailedPathwayData.scholarships || [],
          costs: detailedPathwayData.costs || {},
          languageRequirements: detailedPathwayData.languageRequirements || {},
          admissionRequirements: detailedPathwayData.admissionRequirements || {},
          careerProspects: detailedPathwayData.careerProspects || {},
          livingInfo: detailedPathwayData.livingInfo || {},
          additionalSupport: detailedPathwayData.additionalSupport || {},
          specialConsiderations: detailedPathwayData.specialConsiderations || {},
        };

        console.log('✅ Comprehensive pathway generated with detailed information:', detailedPathway);
        
        // Save the detailed pathway
        await studyAbroadService.saveUserPathway(currentUser.uid, detailedPathway);
          // Set the pathway in state
        setPathway(detailedPathway);
      
        const remaining = getRemainingCount('generatePathway');
        const remainingText = remaining === Infinity ? '' : ` (${remaining} remaining this month)`;
        setAlert({
          type: 'success',
          message: `Your study abroad pathway has been generated with the latest program information!${remainingText}`
        });
      }
    } catch (error) {
      console.error('Error generating pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate your pathway. Please try again.'
      });
    } finally {
      setGeneratingPath(false);
    }
  };
  const updateStepStatus = async (stepIndex, newStatus) => {
    if (!pathway) return;

    try {
      const updatedSteps = [...pathway.steps];
      const step = updatedSteps[stepIndex];
      
      // Update status
      step.status = newStatus;
      
      // Add completion timestamp if marking as completed
      if (newStatus === 'completed') {
        step.completedAt = new Date().toISOString();
      } else {
        // Remove completion timestamp if changing from completed
        delete step.completedAt;
      }
      
      const updatedPathway = { ...pathway, steps: updatedSteps };
      setPathway(updatedPathway);

      // Save updated pathway
      await studyAbroadService.saveUserPathway(currentUser.uid, updatedPathway);
      
      const statusText = newStatus === 'completed' ? 'completed' : 
                        newStatus === 'in-progress' ? 'started' : 'reset to pending';
      
      setAlert({
        type: 'success',
        message: `Step ${step.step} ${statusText} successfully!`
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update step status.'
      });
    }
  };const regeneratePathway = async () => {
    if (!userProfile) return;

    // Check subscription limits for pathway regeneration
    if (!canUseMyStudyPath) {
      showUpgradePrompt('useMyStudyPath', () => setShowUpgradeModal(true));
      return;
    }
    
    setGeneratingPath(true);
    setAlert({
      type: 'info',
      message: 'Checking for profile changes and regenerating comprehensive AI-powered pathway...',
      icon: <FaSync className="animate-spin" />
    });
    
    try {
      // Check for profile changes first
      const profileUpdateTimestamp = localStorage.getItem(`profileUpdate_${currentUser.uid}`);
      if (profileUpdateTimestamp && profileUpdateTimestamp !== lastProfileUpdate) {
        console.log('📋 Profile changes detected during manual refresh, updating lastProfileUpdate');
        setLastProfileUpdate(profileUpdateTimestamp);
        
        // Check if the country or course has changed (major changes)
        const currentCountry = userProfile.preferred_countries?.[0];
        const currentCourse = userProfile.preferred_fields_of_study?.[0];
        
        if (pathway && (pathway.country !== currentCountry || pathway.course !== currentCourse)) {
          setAlert({
            type: 'info',
            message: '🔄 Major profile changes detected. Generating updated pathway with new preferences...',
            icon: <FaSync className="animate-spin" />
          });
        } else {
          setAlert({
            type: 'info',
            message: '🔄 Regenerating pathway with latest information and profile updates...',
            icon: <FaSync className="animate-spin" />
          });
        }
      }
      
      // Track usage for regeneration
      const tracked = await trackUsage('useMyStudyPath');
      if (!tracked) {
        setAlert({
          type: 'error',
          message: 'Failed to track usage. Please try again.'
        });
        setGeneratingPath(false);
        return;
      }

      // Import PathwayScrapingService directly - same as in generatePersonalizedPath
      const pathwayScrapingService = (await import('../../services/pathwayScrapingService.js')).default;
      
      // Create detailed profile for AI analysis - matching the approach in generateDetailedAnalysis
      const detailedProfile = {
        country: userProfile.preferred_countries?.[0] || 'USA',
        course: userProfile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: userProfile.education_level || 'Bachelor',
        nationality: userProfile.nationality || 'Indian',
        budgetRange: {
          name: userProfile.budget_min && userProfile.budget_max ? 
            (userProfile.budget_max > 50000 ? 'High' : userProfile.budget_max > 25000 ? 'Medium' : 'Low') : 'Medium',
          min: userProfile.budget_min || 25000,
          max: userProfile.budget_max || 75000
        }
      };

      console.log('📋 Detailed profile for comprehensive AI regeneration:', detailedProfile);
      
      // Generate comprehensive pathway using PathwayScrapingService AI function
      const detailedPathwayData = await pathwayScrapingService.generatePathwayWithAI(detailedProfile);
      
      if (detailedPathwayData) {
        // Transform the AI response to match our pathway structure
        const detailedPathway = {
          id: `mystudypath_${Date.now()}`,
          userId: currentUser.uid,
          country: detailedProfile.country,
          course: detailedProfile.course,
          academicLevel: detailedProfile.academicLevel,
          type: 'detailed_ai_analysis',
          source: 'mystudypath_ai',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          
          // Universities from AI response
          universities: detailedPathwayData.universities || [],
          
          // Convert timeline to our step format
          steps: detailedPathwayData.timeline ? detailedPathwayData.timeline.map((timelineItem, index) => ({
            step: index + 1,
            title: timelineItem.month || `Step ${index + 1}`,
            description: timelineItem.tasks?.join(', ') || 'Complete tasks for this phase',
            duration: '1 month',
            status: 'pending',
            tasks: timelineItem.tasks || [],
            priority: timelineItem.priority || 'medium',
            documents: timelineItem.documents || 'Review required documents'
          })) : [],
          
          // Additional AI data
          documents: detailedPathwayData.documents || [],
          visaRequirements: detailedPathwayData.visaRequirements || {},
          scholarships: detailedPathwayData.scholarships || [],
          costs: detailedPathwayData.costs || {},
          languageRequirements: detailedPathwayData.languageRequirements || {},
          admissionRequirements: detailedPathwayData.admissionRequirements || {},
          careerProspects: detailedPathwayData.careerProspects || {},
          livingInfo: detailedPathwayData.livingInfo || {},
          additionalSupport: detailedPathwayData.additionalSupport || {},
          specialConsiderations: detailedPathwayData.specialConsiderations || {},
        };

        console.log('✅ Comprehensive pathway regenerated with detailed information:', detailedPathway);
        
        // Save the detailed pathway
        await studyAbroadService.saveUserPathway(currentUser.uid, detailedPathway);
          // Set the pathway in state
        setPathway(detailedPathway);
      
        const remaining = getRemainingCount('generatePathway');
        const remainingText = remaining === Infinity ? '' : ` (${remaining} remaining this month)`;
        setAlert({
          type: 'success',
          message: `✨ Your comprehensive study abroad pathway has been regenerated with the latest information!${remainingText}`
        });
      }
    } catch (error) {
      console.error('Error refreshing pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to refresh your pathway. Please try again.'
      });
    } finally {
      setGeneratingPath(false);
    }
  };

  const getStepStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'in-progress':
        return <FaClock className="text-yellow-500" />;
      case 'pending':
        return <FaExclamationTriangle className="text-gray-400" />;
      default:
        return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  const getCompletionPercentage = () => {
    if (!pathway?.steps) return 0;
    const completedSteps = pathway.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / pathway.steps.length) * 100);
  };  // Effect to check for profile updates only when lastProfileUpdate changes (manual trigger)
  useEffect(() => {
    const checkForProfileUpdates = async () => {
      if (!currentUser || !userProfile || !pathway) return;
      
      const profileUpdateTimestamp = localStorage.getItem(`profileUpdate_${currentUser.uid}`);
      if (profileUpdateTimestamp && profileUpdateTimestamp !== lastProfileUpdate) {
        console.log('📋 Profile update detected, but not auto-refreshing. User can manually refresh if needed.');
        setLastProfileUpdate(profileUpdateTimestamp);
        
        // Show notification that profile has changed, but don't auto-update
        setAlert({
          type: 'info',
          message: '📋 Profile changes detected. Click "Refresh Pathway" to update your pathway with new preferences.',
          icon: <FaInfoCircle />
        });
      }
    };

    // Only check once when the component mounts or lastProfileUpdate changes
    checkForProfileUpdates();
  }, [currentUser, lastProfileUpdate, userProfile?.updated_at]);

  const generateDetailedAnalysis = async (selectedPathway, profile) => {
    try {
      console.log('🔍 Generating detailed AI analysis for selected pathway');
      setGeneratingPath(true);
      setAlert({
        type: 'info',
        message: 'Generating detailed AI-powered analysis from your selected pathway...',
        icon: <FaSync className="animate-spin" />
      });

      // Import PathwayScrapingService
      const pathwayScrapingService = (await import('../../services/pathwayScrapingService.js')).default;
      
      // Create detailed profile for AI analysis
      const detailedProfile = {
        country: selectedPathway.country || profile.preferred_countries?.[0] || 'USA',
        course: selectedPathway.course || profile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: selectedPathway.academicLevel || profile.education_level || 'Master',
        nationality: profile.nationality || 'Indian',
        budgetRange: {
          name: 'Medium',
          min: profile.budget_min || 25000,
          max: profile.budget_max || 75000
        }
      };

      console.log('📋 Detailed profile for AI analysis:', detailedProfile);

      // Generate comprehensive pathway using PathwayScrapingService AI function
      const detailedPathwayData = await pathwayScrapingService.generatePathwayWithAI(detailedProfile);
      
      if (detailedPathwayData) {
        // Transform the AI response to match our pathway structure
        const detailedPathway = {
          id: `detailed_${Date.now()}`,
          userId: currentUser.uid,
          country: detailedProfile.country,
          course: detailedProfile.course,
          academicLevel: detailedProfile.academicLevel,
          type: 'detailed_ai_analysis',
          source: 'pathway_scraping_ai',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          
          // Universities from AI response
          universities: detailedPathwayData.universities || [],
          
          // Convert timeline to our step format
          steps: detailedPathwayData.timeline ? detailedPathwayData.timeline.map((timelineItem, index) => ({
            step: index + 1,
            title: timelineItem.month || `Step ${index + 1}`,
            description: timelineItem.tasks?.join(', ') || 'Complete tasks for this phase',
            duration: '1 month',
            status: 'pending',
            tasks: timelineItem.tasks || [],
            priority: timelineItem.priority || 'medium',
            documents: timelineItem.documents || 'Review required documents'
          })) : [],
          
          // Additional AI data
          documents: detailedPathwayData.documents || [],
          visaRequirements: detailedPathwayData.visaRequirements || {},
          scholarships: detailedPathwayData.scholarships || [],
          costs: detailedPathwayData.costs || {},
          languageRequirements: detailedPathwayData.languageRequirements || {},
          admissionRequirements: detailedPathwayData.admissionRequirements || {},
          careerProspects: detailedPathwayData.careerProspects || {},
          livingInfo: detailedPathwayData.livingInfo || {},
          additionalSupport: detailedPathwayData.additionalSupport || {},
          specialConsiderations: detailedPathwayData.specialConsiderations || {},
          
          // Mark as detailed analysis
          isDetailedAnalysis: true,
          sourcePathway: selectedPathway
        };

        console.log('✅ Detailed pathway analysis generated:', detailedPathway);

        // Save the detailed pathway
        await studyAbroadService.saveUserPathway(currentUser.uid, detailedPathway);
        
        // Clear the selected pathway flag
        await studyAbroadService.clearSelectedPathway(currentUser.uid);
        
        // Set the pathway in state
        setPathway(detailedPathway);
        
        setAlert({
          type: 'success',
          message: '✨ Detailed AI analysis complete! Your comprehensive study abroad pathway is ready.',
          icon: <FaCheckCircle />
        });
      } else {
        throw new Error('Failed to generate detailed analysis');
      }
    } catch (error) {
      console.error('Error generating detailed analysis:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate detailed analysis. Please try again.'
      });
      
      // Fallback to loading existing pathway
      await loadExistingPathway(profile);
    } finally {
      setGeneratingPath(false);
    }
  };  if (loading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  // Debug log for render state
  console.log('🔍 MyStudyAbroadPath render state:', {
    loading,
    subscriptionLoading,
    hasUserProfile: !!userProfile,
    hasPathway: !!pathway,
    pathwayId: pathway?.id,
    canUseMyStudyPath: canUseMyStudyPath
  });

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaUser className="mx-auto text-gray-400 text-6xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile First</h2>
          <p className="text-gray-600 mb-6">
            To generate your personalized study abroad pathway, please complete your academic profile with your preferences and goals.
          </p>
          <Button 
            onClick={() => window.location.href = '/profile'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  if (!isProfileComplete(userProfile)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Incomplete</h2>
            <p className="text-gray-600 mb-6">
              Your profile is missing some essential information needed to generate a personalized study abroad pathway.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Information:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!userProfile.full_name && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Full Name
                </div>
              )}
              {!userProfile.nationality && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Nationality
                </div>
              )}
              {!userProfile.education_level && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Education Level
                </div>
              )}
              {(!userProfile.preferred_countries || userProfile.preferred_countries.length === 0) && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Preferred Countries
                </div>
              )}
              {(!userProfile.preferred_fields_of_study || userProfile.preferred_fields_of_study.length === 0) && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Field of Study
                </div>
              )}
              {!userProfile.target_intake && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Target Intake
                </div>
              )}
              {!userProfile.target_year && (
                <div className="flex items-center text-red-600">
                  <FaExclamationTriangle className="mr-2" />
                  Target Year
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => window.location.href = '/profile'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Complete Profile
            </Button>
          </div>
        </div>
      </div>    );
  }  // Check subscription access for MyStudyPath - but only if we don't have pathway data
  if (!subscriptionLoading && !canUseMyStudyPath && !pathway) {
    console.log('❌ MyStudyAbroadPath: Showing upgrade modal because canPerformAction returned false', {
      subscriptionLoading,
      planType,
      limits,
      usage,
      canPerformResult: canPerformAction('useMyStudyPath')
    });
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaCrown className="mx-auto text-yellow-500 text-6xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            My Study Abroad Path is a premium feature that provides personalized pathway tracking and guidance.
            Upgrade your plan to access your complete study abroad roadmap.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">With Premium, you get:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" /> Personalized study abroad pathway</li>
              <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" /> Step-by-step guidance and tracking</li>
              <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" /> Timeline management and reminders</li>
              <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" /> Visa requirements and documentation help</li>
              <li className="flex items-center"><FaCheckCircle className="text-green-500 mr-2" /> Cost breakdown and budget planning</li>
            </ul>
          </div>
          <Button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Upgrade to Premium
          </Button>
        </div>
        
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Choose Your Plan</h3>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <SubscriptionPlans />
              </div>
            </div>
          </div>
        )}      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-4">My Study Abroad Path</h1>
        <p className="text-blue-100 mb-6">
          Your personalized pathway to studying {userProfile.preferred_fields_of_study?.[0]} in {userProfile.preferred_countries?.[0]}
        </p>        {pathway && (
          <div className="bg-white bg-opacity-25 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white drop-shadow-sm">Pathway Progress</span>
              <span className="text-sm font-bold text-white drop-shadow-sm">{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2 shadow-inner">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}        {/* Pathway Actions */}
        {pathway && (
          <div className="mt-4 flex gap-3">
            <Button
              onClick={regeneratePathway}
              disabled={generatingPath}
              className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white border border-white border-opacity-40 font-semibold drop-shadow-sm backdrop-blur-sm"
            >
              <FaSync className={`mr-2 ${generatingPath ? 'animate-spin' : ''}`} />
              {generatingPath ? 'Refreshing...' : 'Refresh Pathway'}
            </Button>
            <Button
              onClick={() => window.location.href = '/pathway-history'}
              className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white border border-white border-opacity-40 font-semibold drop-shadow-sm backdrop-blur-sm"
            >
              <FaBell className="mr-2" />
              View History
            </Button>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center">
            <FaUser className="text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold">{userProfile.full_name}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FaGlobe className="text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Target Country</p>
              <p className="font-semibold">{userProfile.preferred_countries?.[0]}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FaGraduationCap className="text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Field of Study</p>
              <p className="font-semibold">{userProfile.preferred_fields_of_study?.[0]}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Target Timeline</p>
              <p className="font-semibold">{userProfile.target_intake} {userProfile.target_year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Information:</h3>
          <p className="text-xs text-gray-600">User Profile: {userProfile ? '✅ Loaded' : '❌ Missing'}</p>
          <p className="text-xs text-gray-600">Pathway: {pathway ? '✅ Loaded' : '❌ Missing'}</p>
          <p className="text-xs text-gray-600">Profile Complete: {isProfileComplete(userProfile) ? '✅ Yes' : '❌ No'}</p>
          {pathway && (
            <>
              <p className="text-xs text-gray-600">Pathway Steps: {pathway.steps?.length || 0}</p>
              <p className="text-xs text-gray-600">Country: {pathway.country || 'Not set'}</p>
              <p className="text-xs text-gray-600">Course: {pathway.course || 'Not set'}</p>
            </>
          )}
        </div>
      )}

      {/* Generate Pathway Button */}
      {!pathway && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Your Journey?</h2>
          <p className="text-gray-600 mb-6">
            Generate your personalized study abroad pathway based on your profile and preferences.
          </p>
          <Button
            onClick={() => generatePersonalizedPath()}
            disabled={generatingPath}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            {generatingPath ? 'Generating Your Path...' : 'Generate My Pathway'}
          </Button>
        </div>
      )}

      {/* No Pathway Available */}
      {!pathway && !generatingPath && userProfile && isProfileComplete(userProfile) && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 13l-6-3m6 3V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Pathway Available</h2>
          <p className="text-gray-600 mb-6">
            We couldn't load or generate your study abroad pathway. Let's try creating one now.
          </p>
          <Button
            onClick={() => generatePersonalizedPath()}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            Generate My Pathway
          </Button>
        </div>
      )}

      {/* Pathway Steps */}
      {pathway && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Study Abroad Roadmap</h2>
              <Button
                onClick={() => generatePersonalizedPath()}
                disabled={generatingPath}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generatingPath ? 'Updating...' : 'Refresh Pathway'}
              </Button>
            </div>

            <div className="space-y-6">
              {pathway.steps?.map((step, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-6 transition-all duration-200 ${
                    activeStep === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center mr-4">
                        {getStepStatusIcon(step.status)}
                        <span className="ml-2 text-lg font-bold text-gray-700">
                          Step {step.step}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          step.status === 'completed' ? 'bg-green-100 text-green-800' :
                          step.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {step.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                        {step.completedAt && (
                          <p className="text-sm text-green-600 mt-1">
                            <FaCheckCircle className="inline w-3 h-3 mr-1" />
                            Completed on {new Date(step.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div><div className="flex space-x-2">
                      {/* Enhanced Status Toggle Buttons */}
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => updateStepStatus(index, 'pending')}
                          className={`px-2 py-1 text-xs ${
                            step.status === 'pending' 
                              ? 'bg-gray-600 text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title="Mark as Pending"
                        >
                          <FaExclamationTriangle className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => updateStepStatus(index, 'in-progress')}
                          className={`px-2 py-1 text-xs ${
                            step.status === 'in-progress' 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-yellow-200'
                          }`}
                          title="Mark as In Progress"
                        >
                          <FaClock className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => updateStepStatus(index, 'completed')}
                          className={`px-2 py-1 text-xs ${
                            step.status === 'completed' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-green-200'
                          }`}
                          title="Mark as Completed"
                        >
                          <FaCheckCircle className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Button
                        onClick={() => setActiveStep(activeStep === index ? null : index)}
                        className="bg-blue-500 hover:bg-blue-600 px-3 py-1 text-sm text-white"
                      >
                        {activeStep === index ? 'Hide Details' : 'View Details'}                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{step.description}</p>
                  <p className="text-sm text-blue-600 font-medium">Duration: {step.duration}</p>

                  {activeStep === index && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tasks Section */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <FaListUl className="mr-2 text-blue-500" />
                            Tasks to Complete:
                          </h4>
                          <ul className="space-y-2">
                            {step.tasks?.map((task, taskIndex) => (
                              <li key={taskIndex} className="flex items-start text-gray-700">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                                <span className="text-sm">{task}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {/* Step Priority */}
                          {step.priority && (
                            <div className="mt-3">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                step.priority === 'high' ? 'bg-red-100 text-red-800' :
                                step.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                <FaFlag className="w-3 h-3 mr-1" />
                                {step.priority.charAt(0).toUpperCase() + step.priority.slice(1)} Priority
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Context-Sensitive Information */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <FaInfoCircle className="mr-2 text-blue-500" />
                            Related Information:
                          </h4>
                          
                          {/* Show relevant visa, cost, or language info based on step content */}
                          <div className="space-y-3 text-sm">
                            {step.title.toLowerCase().includes('visa') && pathway.visaRequirements && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <h6 className="font-medium text-blue-900 mb-2">Visa Requirements:</h6>
                                <p className="text-blue-800">
                                  Type: {pathway.visaRequirements.type || 'Student Visa'}<br/>
                                  Processing Time: {pathway.visaRequirements.processingTime || 'N/A'}
                                </p>
                              </div>
                            )}
                            
                            {step.title.toLowerCase().includes('cost') && pathway.costs && (
                              <div className="p-3 bg-green-50 rounded-lg">
                                <h6 className="font-medium text-green-900 mb-2">Cost Information:</h6>
                                <p className="text-green-800">
                                  Tuition: ${pathway.costs.tuition?.average || 'N/A'}<br/>
                                  Living: ${pathway.costs.living?.total || 'N/A'}
                                </p>
                              </div>
                            )}
                            
                            {step.title.toLowerCase().includes('language') && pathway.languageRequirements && (
                              <div className="p-3 bg-purple-50 rounded-lg">
                                <h6 className="font-medium text-purple-900 mb-2">Language Requirements:</h6>
                                <p className="text-purple-800">
                                  IELTS: {pathway.languageRequirements.ielts?.overall || 'N/A'}<br/>
                                  TOEFL: {pathway.languageRequirements.toefl?.overall || 'N/A'}
                                </p>
                              </div>
                            )}
                            
                            {!step.title.toLowerCase().includes('visa') && 
                             !step.title.toLowerCase().includes('cost') && 
                             !step.title.toLowerCase().includes('language') && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-gray-600">
                                  Complete this step to progress in your study abroad journey.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Documents Section */}
                      {step.documents && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <FaFileAlt className="mr-2 text-green-500" />
                            Required Documents:
                          </h5>
                          <p className="text-sm text-gray-700">{step.documents}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* University Recommendations Section */}
          {pathway.universities && pathway.universities.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Universities</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuition</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pathway.universities.map((university, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{university.name}</div>
                          {university.specialties && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-semibold">Specialties:</span> {university.specialties.join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">{university.ranking}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{university.location}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{university.tuitionFee}</td>
                        <td className="px-4 py-4 text-xs">
                          {university.requirements && (
                            <>
                              <div><span className="font-semibold">GPA:</span> {university.requirements.gpa}</div>
                              <div><span className="font-semibold">IELTS:</span> {university.requirements.ielts}</div>
                              <div><span className="font-semibold">TOEFL:</span> {university.requirements.toefl}</div>
                              {university.requirements.gre && (
                                <div><span className="font-semibold">GRE:</span> {university.requirements.gre}</div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Visa Requirements Section */}
          {pathway.visaRequirements && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Visa Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Visa Information</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Type:</span> {pathway.visaRequirements.type}</p>
                    <p><span className="font-medium">Processing Time:</span> {pathway.visaRequirements.processingTime}</p>
                    <p><span className="font-medium">Fee:</span> {pathway.visaRequirements.fee}</p>
                    <p><span className="font-medium">Financial Proof:</span> {pathway.visaRequirements.financialProof}</p>
                    {pathway.visaRequirements.medicalRequirements && (
                      <p><span className="font-medium">Medical Requirements:</span> {pathway.visaRequirements.medicalRequirements}</p>
                    )}
                    {pathway.visaRequirements.biometrics && (
                      <p><span className="font-medium">Biometrics:</span> {pathway.visaRequirements.biometrics}</p>
                    )}
                    {pathway.visaRequirements.interview && (
                      <p><span className="font-medium">Interview:</span> {pathway.visaRequirements.interview}</p>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Documents</h3>
                  {pathway.visaRequirements.requirements && pathway.visaRequirements.requirements.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {pathway.visaRequirements.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scholarships Section */}
          {pathway.scholarships && pathway.scholarships.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Scholarship Opportunities</h2>
              <div className="grid grid-cols-1 gap-4">
                {pathway.scholarships.map((scholarship, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="text-lg font-semibold text-blue-800">{scholarship.name}</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm">
                        <p><span className="font-medium">Amount:</span> {scholarship.amount}</p>
                        <p><span className="font-medium">Deadline:</span> {scholarship.deadline}</p>
                        <p><span className="font-medium">Competitiveness:</span> {scholarship.competitiveness || "Medium"}</p>
                        {scholarship.renewability && (
                          <p><span className="font-medium">Renewability:</span> {scholarship.renewability}</p>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">Eligibility:</p>
                        <p className="text-gray-700">{scholarship.eligibility}</p>
                        <p className="font-medium mt-2">How to Apply:</p>
                        <p className="text-gray-700">{scholarship.applicationProcess}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language Requirements Section */}
          {pathway.languageRequirements && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Language Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">IELTS Requirements</h3>
                  {pathway.languageRequirements.ielts && (
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Overall Score:</span> {pathway.languageRequirements.ielts.overall}</p>
                      <p><span className="font-medium">Individual Bands:</span> {pathway.languageRequirements.ielts.individual}</p>
                      <p><span className="font-medium">Validity:</span> {pathway.languageRequirements.ielts.validity}</p>
                    </div>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">TOEFL Requirements</h3>
                  {pathway.languageRequirements.toefl && (
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Overall Score:</span> {pathway.languageRequirements.toefl.overall}</p>
                      <p><span className="font-medium">Individual Sections:</span> {pathway.languageRequirements.toefl.individual}</p>
                      <p><span className="font-medium">Validity:</span> {pathway.languageRequirements.toefl.validity}</p>
                    </div>
                  )}
                </div>
              </div>
              {pathway.languageRequirements.alternatives && pathway.languageRequirements.alternatives.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Alternative Tests</h3>
                  <p className="text-gray-700">{pathway.languageRequirements.alternatives.join(", ")}</p>
                </div>
              )}
              {pathway.languageRequirements.preparationTips && pathway.languageRequirements.preparationTips.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparation Tips</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    {pathway.languageRequirements.preparationTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pathway.languageRequirements.exemptions && (
                <div className="mt-4 p-4 border rounded-lg bg-green-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Exemptions</h3>
                  <p className="text-gray-700">{pathway.languageRequirements.exemptions}</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Section */}
          {pathway.documents && pathway.documents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Required Documents</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Time</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pathway.documents.map((doc, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          {doc.required !== undefined && (
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {doc.required ? 'Required' : 'Optional'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">{doc.description}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{doc.processingTime}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{doc.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Career Prospects Section */}
          {pathway.careerProspects && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Career Prospects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pathway.careerProspects.averageSalary && (
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-white">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Average Salaries</h3>
                    <div className="space-y-2">
                      {pathway.careerProspects.averageSalary.entryLevel && (
                        <p><span className="font-medium">Entry Level:</span> <span className="text-green-600 font-medium">{pathway.careerProspects.averageSalary.entryLevel}</span></p>
                      )}
                      {pathway.careerProspects.averageSalary.experienced && (
                        <p><span className="font-medium">Experienced:</span> <span className="text-green-600 font-medium">{pathway.careerProspects.averageSalary.experienced}</span></p>
                      )}
                      {pathway.careerProspects.averageSalary.topTier && (
                        <p><span className="font-medium">Top Tier:</span> <span className="text-green-600 font-medium">{pathway.careerProspects.averageSalary.topTier}</span></p>
                      )}
                    </div>
                  </div>
                )}
                {pathway.careerProspects.jobMarket && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Market</h3>
                    <div className="space-y-2">
                      {pathway.careerProspects.jobMarket.outlook && (
                        <p><span className="font-medium">Outlook:</span> {pathway.careerProspects.jobMarket.outlook}</p>
                      )}
                      {pathway.careerProspects.jobMarket.growthRate && (
                        <p><span className="font-medium">Growth Rate:</span> {pathway.careerProspects.jobMarket.growthRate}</p>
                      )}
                      {pathway.careerProspects.jobMarket.demand && (
                        <p><span className="font-medium">Demand:</span> {pathway.careerProspects.jobMarket.demand}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {pathway.careerProspects.topEmployers && pathway.careerProspects.topEmployers.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Employers</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {pathway.careerProspects.topEmployers.map((employer, index) => (
                        <li key={index} className="text-gray-700">{employer}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pathway.careerProspects.jobRoles && pathway.careerProspects.jobRoles.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Roles</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {pathway.careerProspects.jobRoles.map((role, index) => (
                        <li key={index} className="text-gray-700">{role}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {pathway.careerProspects.workVisa && (
                <div className="border rounded-lg p-4 mt-6 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Visa Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pathway.careerProspects.workVisa.options && pathway.careerProspects.workVisa.options.length > 0 && (
                      <div>
                        <p className="font-medium">Visa Options:</p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {pathway.careerProspects.workVisa.options.map((option, index) => (
                            <li key={index}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pathway.careerProspects.workVisa.duration && (
                      <div>
                        <p className="font-medium">Duration:</p>
                        <p className="text-gray-700">{pathway.careerProspects.workVisa.duration}</p>
                      </div>
                    )}
                    {pathway.careerProspects.workVisa.pathToPR && (
                      <div>
                        <p className="font-medium">Path to PR:</p>
                        <p className="text-gray-700">{pathway.careerProspects.workVisa.pathToPR}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Living Information Section */}
          {pathway.livingInfo && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Living Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pathway.livingInfo.climate && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Climate</h3>
                    <div className="space-y-2 text-gray-700">
                      {pathway.livingInfo.climate.description && (
                        <p><span className="font-medium">Description:</span> {pathway.livingInfo.climate.description}</p>
                      )}
                      {pathway.livingInfo.climate.seasons && (
                        <p><span className="font-medium">Seasons:</span> {pathway.livingInfo.climate.seasons}</p>
                      )}
                      {pathway.livingInfo.climate.clothing && (
                        <p><span className="font-medium">Clothing:</span> {pathway.livingInfo.climate.clothing}</p>
                      )}
                    </div>
                  </div>
                )}
                {pathway.livingInfo.culture && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Culture</h3>
                    <div className="space-y-2 text-gray-700">
                      {pathway.livingInfo.culture.description && (
                        <p><span className="font-medium">Description:</span> {pathway.livingInfo.culture.description}</p>
                      )}
                      {pathway.livingInfo.culture.diversity && (
                        <p><span className="font-medium">Diversity:</span> {pathway.livingInfo.culture.diversity}</p>
                      )}
                      {pathway.livingInfo.culture.socialNorms && (
                        <p><span className="font-medium">Social Norms:</span> {pathway.livingInfo.culture.socialNorms}</p>
                      )}
                      {pathway.livingInfo.culture.festivals && (
                        <p><span className="font-medium">Festivals:</span> {pathway.livingInfo.culture.festivals}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {pathway.livingInfo.housing && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Housing</h3>
                    <div className="space-y-2 text-gray-700">
                      {pathway.livingInfo.housing.options && pathway.livingInfo.housing.options.length > 0 && (
                        <p><span className="font-medium">Options:</span> {pathway.livingInfo.housing.options.join(", ")}</p>
                      )}
                      {pathway.livingInfo.housing.costs && (
                        <p><span className="font-medium">Costs:</span> {pathway.livingInfo.housing.costs}</p>
                      )}
                      {pathway.livingInfo.housing.tips && (
                        <p><span className="font-medium">Tips:</span> {pathway.livingInfo.housing.tips}</p>
                      )}
                      {pathway.livingInfo.housing.contracts && (
                        <p><span className="font-medium">Contracts:</span> {pathway.livingInfo.housing.contracts}</p>
                      )}
                    </div>
                  </div>
                )}
                {pathway.livingInfo.transportation && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Transportation</h3>
                    <div className="space-y-2 text-gray-700">
                      {pathway.livingInfo.transportation.public && (
                        <p><span className="font-medium">Public:</span> {pathway.livingInfo.transportation.public}</p>
                      )}
                      {pathway.livingInfo.transportation.costs && (
                        <p><span className="font-medium">Costs:</span> {pathway.livingInfo.transportation.costs}</p>
                      )}
                      {pathway.livingInfo.transportation.studentDiscounts && (
                        <p><span className="font-medium">Student Discounts:</span> {pathway.livingInfo.transportation.studentDiscounts}</p>
                      )}
                      {pathway.livingInfo.transportation.cycling && (
                        <p><span className="font-medium">Cycling:</span> {pathway.livingInfo.transportation.cycling}</p>
                      )}
                    </div>
                  </div>
                )}
                {pathway.livingInfo.healthcare && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Healthcare</h3>
                    <div className="space-y-2 text-gray-700">
                      {pathway.livingInfo.healthcare.system && (
                        <p><span className="font-medium">System:</span> {pathway.livingInfo.healthcare.system}</p>
                      )}
                      {pathway.livingInfo.healthcare.insurance && (
                        <p><span className="font-medium">Insurance:</span> {pathway.livingInfo.healthcare.insurance}</p>
                      )}
                      {pathway.livingInfo.healthcare.costs && (
                        <p><span className="font-medium">Costs:</span> {pathway.livingInfo.healthcare.costs}</p>
                      )}
                      {pathway.livingInfo.healthcare.access && (
                        <p><span className="font-medium">Access:</span> {pathway.livingInfo.healthcare.access}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {pathway.livingInfo.safety && (
                <div className="border rounded-lg p-4 mt-6 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    {pathway.livingInfo.safety.overview && (
                      <div>
                        <p><span className="font-medium">Overview:</span> {pathway.livingInfo.safety.overview}</p>
                      </div>
                    )}
                    {pathway.livingInfo.safety.emergencyNumbers && (
                      <div>
                        <p><span className="font-medium">Emergency Numbers:</span> {pathway.livingInfo.safety.emergencyNumbers}</p>
                      </div>
                    )}
                    {pathway.livingInfo.safety.campusSafety && (
                      <div>
                        <p><span className="font-medium">Campus Safety:</span> {pathway.livingInfo.safety.campusSafety}</p>
                      </div>
                    )}
                    {pathway.livingInfo.safety.tips && (
                      <div>
                        <p><span className="font-medium">Safety Tips:</span> {pathway.livingInfo.safety.tips}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Support and Special Considerations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Additional Support */}
            {pathway.additionalSupport && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Support Services</h2>
                <div className="space-y-3 text-gray-700">
                  {pathway.additionalSupport.orientation && (
                    <p><span className="font-medium">Orientation:</span> {pathway.additionalSupport.orientation}</p>
                  )}
                  {pathway.additionalSupport.internationalOffice && (
                    <p><span className="font-medium">International Office:</span> {pathway.additionalSupport.internationalOffice}</p>
                  )}
                  {pathway.additionalSupport.academicSupport && (
                    <p><span className="font-medium">Academic Support:</span> {pathway.additionalSupport.academicSupport}</p>
                  )}
                  {pathway.additionalSupport.counseling && (
                    <p><span className="font-medium">Counseling:</span> {pathway.additionalSupport.counseling}</p>
                  )}
                  {pathway.additionalSupport.careerServices && (
                    <p><span className="font-medium">Career Services:</span> {pathway.additionalSupport.careerServices}</p>
                  )}
                  {pathway.additionalSupport.languageSupport && (
                    <p><span className="font-medium">Language Support:</span> {pathway.additionalSupport.languageSupport}</p>
                  )}
                </div>
              </div>
            )}

            {/* Special Considerations */}
            {pathway.specialConsiderations && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Special Considerations</h2>
                <div className="space-y-3 text-gray-700">
                  {pathway.specialConsiderations.covid19 && (
                    <p><span className="font-medium">COVID-19 Requirements:</span> {pathway.specialConsiderations.covid19}</p>
                  )}
                  {pathway.specialConsiderations.culturalAdaptation && (
                    <p><span className="font-medium">Cultural Adaptation:</span> {pathway.specialConsiderations.culturalAdaptation}</p>
                  )}
                  {pathway.specialConsiderations.homesickness && (
                    <p><span className="font-medium">Homesickness:</span> {pathway.specialConsiderations.homesickness}</p>
                  )}
                  {pathway.specialConsiderations.financialTips && (
                    <p><span className="font-medium">Financial Tips:</span> {pathway.specialConsiderations.financialTips}</p>
                  )}
                  {pathway.specialConsiderations.academicDifferences && (
                    <p><span className="font-medium">Academic Differences:</span> {pathway.specialConsiderations.academicDifferences}</p>
                  )}
                </div>
              </div>
            )}
          </div>          {/* Additional Information Cards */}
          {pathway.timeline && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline Overview</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Total Duration</span>
                    <span className="font-bold text-blue-600">{pathway.timeline?.totalDuration || 'Not specified'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {pathway.timeline.phases?.map((phaseObj, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">{phaseObj.phase}</span>
                          <p className="text-sm text-gray-600 mt-1">{phaseObj.description}</p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">{phaseObj.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Estimation</h3>
                {pathway.costs && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tuition (Annual)</span>
                      <span className="font-medium">
                        {pathway.costs.tuition?.currency} {pathway.costs.tuition?.min?.toLocaleString()} - {pathway.costs.tuition?.max?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Living Expenses</span>
                      <span className="font-medium">
                        {pathway.costs.living?.currency} {pathway.costs.living?.min?.toLocaleString()} - {pathway.costs.living?.max?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Miscellaneous</span>
                      <span className="font-medium">
                        {pathway.costs.miscellaneous?.currency} {pathway.costs.miscellaneous?.min?.toLocaleString()} - {pathway.costs.miscellaneous?.max?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total (First Year)</span>
                      <span className="font-bold text-blue-600">
                        {pathway.costs.total?.currency} {pathway.costs.total?.min?.toLocaleString()} - {pathway.costs.total?.max?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}        </div>
      )}

      {/* Subscription Upgrade Modal */}
      {showUpgradeModal && (
        <SubscriptionPlans onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
};

export default MyStudyAbroadPath;
