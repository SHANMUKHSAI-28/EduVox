import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { academicProfileService } from '../../services/universityService';
import studyAbroadService from '../../services/studyAbroadService';
import SubscriptionPlans from '../subscription/SubscriptionPlans';
import Button from '../common/Button';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaUser, FaGraduationCap, FaDollarSign, FaGlobe, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaSync, FaBell, FaCrown } from 'react-icons/fa';

const MyStudyAbroadPath = () => {
  const { currentUser } = useAuth();  const { 
    canPerformAction, 
    getRemainingCount, 
    trackUsage, 
    showUpgradePrompt, 
    planType,
    limits,
    usage 
  } = useSubscriptionLimits();
  const [loading, setLoading] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [pathway, setPathway] = useState(null);
  const [alert, setAlert] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  useEffect(() => {
    if (currentUser && limits && usage) {
      loadUserProfile();
    }
  }, [currentUser, limits, usage]);const loadUserProfile = async () => {
    try {
      const profile = await academicProfileService.getAcademicProfile(currentUser.uid);
      setUserProfile(profile);
      
      if (profile && isProfileComplete(profile)) {
        // Check subscription before loading existing pathway
        if (canPerformAction('useMyStudyPath')) {
          // Try to load existing pathway first
          await loadExistingPathway(profile);
        } else {
          // User doesn't have access, show upgrade prompt
          console.log('❌ MyStudyPath: User cannot access existing pathway, subscription required');
          setLoading(false);
          setAlert({
            type: 'warning',
            message: 'Upgrade to access your personalized study abroad pathway.'
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
      setLoading(false);
    }
  };
  const loadExistingPathway = async (profile) => {
    try {
      console.log('🔍 Loading existing pathway for user:', currentUser.uid);
      // Try to get existing user pathway
      const existingPathway = await studyAbroadService.getUserPathway(currentUser.uid);
      console.log('📊 Existing pathway:', existingPathway);
      
      if (existingPathway) {
        // Check if pathway needs refresh due to admin updates
        const refreshedPathway = await studyAbroadService.checkAndRefreshPathway(currentUser.uid, existingPathway);
        console.log('🔄 Refresh check result:', refreshedPathway);
        
        if (refreshedPathway && refreshedPathway.success && refreshedPathway.pathway) {
          console.log('✅ Setting refreshed pathway');
          setPathway(refreshedPathway.pathway);
          setAlert({
            type: 'success',
            message: '✨ Your pathway has been updated with the latest program information!',
            icon: <FaSync />
          });
        } else {
          console.log('✅ Setting existing pathway');
          setPathway(existingPathway);
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
      // Fallback to generating new pathway
      await generatePersonalizedPath(profile);
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
    if (!profile) return;

    // Debug logging
    console.log('📚 MyStudyAbroadPath generatePersonalizedPath - Debug Info:', {
      limits,
      usage,
      planType,
      canUseMyStudyPath: canPerformAction('useMyStudyPath')
    });

    // Check subscription limits for MyStudyPath usage
    if (!canPerformAction('useMyStudyPath')) {
      console.log('❌ MyStudyPath: Cannot perform action, showing upgrade prompt');
      showUpgradePrompt('useMyStudyPath', () => setShowUpgradeModal(true));
      return;
    }

    console.log('✅ MyStudyPath: Can perform action, proceeding...');
    console.log('🚀 Generating personalized path for profile:', profile);
    setGeneratingPath(true);
    setAlert(null);try {
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

      // Transform user profile to match pathway service format
      const pathwayData = {
        userId: currentUser.uid,
        preferredCountry: profile.preferred_countries?.[0] || 'USA',
        desiredCourse: profile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: profile.education_level || 'Bachelor',
        budget: {
          min: profile.budget_min || 0,
          max: profile.budget_max || 100000
        },
        currentGPA: profile.cgpa || 0,
        englishProficiency: {
          ielts: profile.ielts_score || 0,
          toefl: profile.toefl_score || 0
        },
        standardizedTests: {
          gre: profile.gre_score || 0
        },
        timeline: {
          targetIntake: profile.target_intake,
          targetYear: profile.target_year
        },
        nationality: profile.nationality,
        fullName: profile.full_name
      };

      console.log('📋 Pathway data to generate:', pathwayData);
      const generatedPathway = await studyAbroadService.generatePathwayWithRefresh(pathwayData);
      console.log('🎯 Generated pathway result:', generatedPathway);
      
      // Check if the result has the expected structure
      if (generatedPathway && generatedPathway.success && generatedPathway.pathway) {
        console.log('✅ Setting pathway from success result');
        setPathway(generatedPathway.pathway);
      } else if (generatedPathway && generatedPathway.steps) {
        console.log('✅ Setting pathway directly');
        setPathway(generatedPathway);
      } else {
        console.log('❌ Unexpected pathway structure:', generatedPathway);
        throw new Error('Invalid pathway structure received');      }
      
      const remaining = getRemainingCount('generatePathway');
      const remainingText = remaining === Infinity ? '' : ` (${remaining} remaining this month)`;
      setAlert({
        type: 'success',
        message: `Your study abroad pathway has been generated with the latest program information!${remainingText}`
      });
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
      updatedSteps[stepIndex].status = newStatus;
      
      const updatedPathway = { ...pathway, steps: updatedSteps };
      setPathway(updatedPathway);

      // Save updated pathway
      await studyAbroadService.saveUserPathway(currentUser.uid, updatedPathway);
      
      setAlert({
        type: 'success',
        message: 'Step status updated successfully!'
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update step status.'
      });
    }
  };  const regeneratePathway = async () => {
    if (!userProfile) return;
      // Check subscription limits for pathway regeneration
    if (!canPerformAction('useMyStudyPath')) {
      showUpgradePrompt('useMyStudyPath', () => setShowUpgradeModal(true));
      return;
    }
    
    setGeneratingPath(true);
    setAlert({
      type: 'info',
      message: 'Refreshing your pathway with the latest information...',
      icon: <FaSync className="animate-spin" />
    });
      try {
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

      const pathwayData = {
        userId: currentUser.uid,
        preferredCountry: userProfile.preferred_countries?.[0] || 'USA',
        desiredCourse: userProfile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: userProfile.education_level || 'Bachelor',
        budget: {
          min: userProfile.budget_min || 0,
          max: userProfile.budget_max || 100000
        },
        currentGPA: userProfile.cgpa || 0,
        englishProficiency: {
          ielts: userProfile.ielts_score || 0,
          toefl: userProfile.toefl_score || 0
        },
        standardizedTests: {
          gre: userProfile.gre_score || 0
        },
        timeline: {
          targetIntake: userProfile.target_intake,
          targetYear: userProfile.target_year
        },
        nationality: userProfile.nationality,
        fullName: userProfile.full_name
      };      const refreshedPathway = await studyAbroadService.generatePathwayWithRefresh(pathwayData);
      setPathway(refreshedPathway);
      
      const remaining = getRemainingCount('generatePathway');
      const remainingText = remaining === Infinity ? '' : ` (${remaining} remaining this month)`;
      setAlert({
        type: 'success',
        message: `✨ Your pathway has been refreshed with the latest program updates and your current profile!${remainingText}`
      });
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
  };
  // Check for profile updates that might require pathway sync
  useEffect(() => {
    const checkForProfileUpdates = async () => {
      if (!currentUser || !userProfile || !pathway) return;
      
      const profileUpdateTimestamp = localStorage.getItem(`profileUpdate_${currentUser.uid}`);
      if (profileUpdateTimestamp && profileUpdateTimestamp !== lastProfileUpdate) {
        setLastProfileUpdate(profileUpdateTimestamp);
        
        // Check if the country or course has changed (major changes)
        const currentCountry = userProfile.preferred_countries?.[0];
        const currentCourse = userProfile.preferred_fields_of_study?.[0];
        
        if (pathway.country !== currentCountry || pathway.course !== currentCourse) {
          setAlert({
            type: 'info',
            message: '🔄 Major profile changes detected. Generating updated pathway...',
            icon: <FaSync className="animate-spin" />
          });
          await generatePersonalizedPath(userProfile);
        } else {
          // Minor changes - just refresh existing pathway
          try {
            const refreshedPathway = await studyAbroadService.checkAndRefreshPathway(currentUser.uid, pathway);
            if (refreshedPathway && refreshedPathway.id !== pathway.id) {
              setPathway(refreshedPathway);
              setAlert({
                type: 'success',
                message: '✨ Your pathway has been updated based on your profile changes.',
                icon: <FaSync />
              });
            }
          } catch (error) {
            console.error('Error refreshing pathway:', error);
          }
        }
      }
    };

    // Check for updates every 10 seconds when component is active
    const interval = setInterval(checkForProfileUpdates, 10000);
    return () => clearInterval(interval);
  }, [currentUser, lastProfileUpdate, userProfile, pathway]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

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
  }

  // Check subscription access for MyStudyPath
  if (limits && usage && !canPerformAction('useMyStudyPath')) {
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
        )}
      </div>
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
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center mr-4">
                        {getStepStatusIcon(step.status)}
                        <span className="ml-2 text-lg font-bold text-gray-700">
                          Step {step.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <div className="flex space-x-2">
                      {step.status !== 'completed' && (
                        <Button
                          onClick={() => updateStepStatus(index, step.status === 'pending' ? 'in-progress' : 'completed')}
                          className={`px-3 py-1 text-sm ${
                            step.status === 'pending' 
                              ? 'bg-yellow-500 hover:bg-yellow-600' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {step.status === 'pending' ? 'Start' : 'Complete'}
                        </Button>
                      )}
                      <Button
                        onClick={() => setActiveStep(activeStep === index ? null : index)}
                        className="bg-gray-500 hover:bg-gray-600 px-3 py-1 text-sm"
                      >
                        {activeStep === index ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-2">{step.description}</p>
                  <p className="text-sm text-blue-600 font-medium">Duration: {step.duration}</p>

                  {activeStep === index && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Tasks:</h4>
                      <ul className="space-y-2">
                        {step.tasks?.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-center text-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
