import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import studyAbroadService from '../../services/studyAbroadService';
import { useNavigate } from 'react-router-dom';
import { 
  FaGlobeAmericas, 
  FaMapMarkedAlt, 
  FaCheckCircle, 
  FaClock, 
  FaArrowRight,
  FaPlus 
} from 'react-icons/fa';

const StudyAbroadWidget = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userPathways, setUserPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePathway, setActivePathway] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadUserPathways();
    }
  }, [currentUser]);

  const loadUserPathways = async () => {
    try {
      const pathways = await studyAbroadService.getUserPathways(currentUser.uid);
      setUserPathways(pathways);
      if (pathways.length > 0) {
        setActivePathway(pathways[0]); // Most recent pathway
      }
    } catch (error) {
      console.error('Error loading user pathways:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (pathway) => {
    if (!pathway || !pathway.steps) return 0;
    const completedSteps = pathway.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / pathway.steps.length) * 100;
  };

  const getNextStep = (pathway) => {
    if (!pathway || !pathway.steps) return null;
    return pathway.steps.find(step => step.status === 'pending' || step.status === 'in-progress');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (userPathways.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md p-6 border border-blue-200">
        <div className="text-center">
          <FaGlobeAmericas className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Your Study Abroad Journey
          </h3>
          <p className="text-gray-600 mb-4">
            Get a personalized roadmap for studying abroad with EdVisor
          </p>
          <button
            onClick={() => navigate('/edvisor')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <FaPlus className="mr-2" />
            Create Your Roadmap
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage(activePathway);
  const nextStep = getNextStep(activePathway);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaMapMarkedAlt className="text-white mr-3" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-white">
                Study Abroad Progress
              </h3>
              <p className="text-blue-100 text-sm">
                {activePathway.country} • {activePathway.course}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/edvisor')}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <FaArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {activePathway.steps.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">
              {activePathway.steps.filter(s => s.status === 'in-progress').length}
            </div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-500">
              {activePathway.steps.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </div>

        {/* Next Step */}
        {nextStep && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                {nextStep.status === 'in-progress' ? (
                  <FaClock className="text-yellow-500" size={16} />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Next: Step {nextStep.step}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {nextStep.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Est. Duration: {nextStep.duration}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => navigate('/edvisor')}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            View Roadmap
          </button>
          {userPathways.length > 1 && (
            <button
              onClick={() => {
                const currentIndex = userPathways.findIndex(p => p.id === activePathway.id);
                const nextIndex = (currentIndex + 1) % userPathways.length;
                setActivePathway(userPathways[nextIndex]);
              }}
              className="px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              Switch Pathway
            </button>
          )}
        </div>

        {/* Multiple Pathways Indicator */}
        {userPathways.length > 1 && (
          <div className="mt-3 text-center">
            <div className="flex justify-center space-x-1">
              {userPathways.map((pathway, index) => (
                <div
                  key={pathway.id}
                  className={`w-2 h-2 rounded-full cursor-pointer ${
                    pathway.id === activePathway.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  onClick={() => setActivePathway(pathway)}
                ></div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {userPathways.length} roadmaps created
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyAbroadWidget;
