import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { academicProfileService } from '../../services/universityService';
import studyAbroadService from '../../services/studyAbroadService';
import Button from '../common/Button';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaUser, FaGraduationCap, FaDollarSign, FaGlobe, FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaSync, FaBell } from 'react-icons/fa';

const MyStudyAbroadPath = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [pathway, setPathway] = useState(null);
  const [alert, setAlert] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);
  const loadUserProfile = async () => {
    try {
      const profile = await academicProfileService.getAcademicProfile(currentUser.uid);
      setUserProfile(profile);
      
      if (profile && isProfileComplete(profile)) {
        // Try to load existing pathway first
        await loadExistingPathway(profile);
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
      // Try to get existing user pathway
      const existingPathway = await studyAbroadService.getUserPathway(currentUser.uid);
      
      if (existingPathway) {
        setPathway(existingPathway);
        setAlert({
          type: 'info',
          message: 'Your saved study abroad pathway has been loaded.'
        });
      } else {
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
  };

  const generatePersonalizedPath = async (profile = userProfile) => {
    if (!profile) return;

    setGeneratingPath(true);
    setAlert(null);

    try {
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
      };      const generatedPathway = await studyAbroadService.generatePathway(pathwayData);
      setPathway(generatedPathway);
      
      setAlert({
        type: 'success',
        message: 'Your study abroad pathway has been updated with your latest profile information!'
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
  };

  const regeneratePathway = async () => {
    if (!userProfile) return;
    
    setAlert({
      type: 'info',
      message: 'Regenerating your pathway with updated profile information...'
    });
    
    await generatePersonalizedPath(userProfile);
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
    const checkForProfileUpdates = () => {
      const profileUpdateTimestamp = localStorage.getItem(`profileUpdate_${currentUser?.uid}`);
      if (profileUpdateTimestamp && profileUpdateTimestamp !== lastProfileUpdate) {
        setLastProfileUpdate(profileUpdateTimestamp);
        setAlert({
          type: 'info',
          message: '🔄 Your pathway has been automatically updated based on your recent profile changes.',
          icon: <FaSync className="animate-spin" />
        });
        // Reload the pathway to show updates
        if (userProfile) {
          loadExistingPathway(userProfile);
        }
      }
    };

    // Check for updates every 5 seconds when component is active
    const interval = setInterval(checkForProfileUpdates, 5000);
    return () => clearInterval(interval);
  }, [currentUser, lastProfileUpdate, userProfile]);

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
        )}

        {/* Pathway Actions */}
        {pathway && (
          <div className="mt-4 flex gap-3">
            <Button
              onClick={regeneratePathway}
              disabled={generatingPath}
              className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white border border-white border-opacity-40 font-semibold drop-shadow-sm backdrop-blur-sm"
            >
              {generatingPath ? 'Regenerating...' : 'Update Pathway'}
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
          )}
        </div>
      )}
    </div>
  );
};

export default MyStudyAbroadPath;
