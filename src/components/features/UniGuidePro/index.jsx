import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../../hooks/useSubscriptionLimits';
import studyAbroadService from '../../../services/studyAbroadService';
import SubscriptionPlans from '../../subscription/SubscriptionPlans';
import { Container } from 'react-bootstrap';

// Import sub-components
import HeroBanner from './HeroBanner';
import LoadingScreen from './LoadingScreen';
import UsageLimitAlert from './UsageLimitAlert';
import PathwayForm from './PathwayForm';
import PathwayResults from './PathwayResults';
import StepModal from './StepModal';

const UniGuidePro = () => {
  const { currentUser } = useAuth();
  const { 
    canPerformAction, 
    trackUsage, 
    showUpgradePrompt, 
    limits, 
    usage, 
    planType,
    loading: subscriptionLoading 
  } = useSubscriptionLimits();
  
  const [loading, setLoading] = useState(false);
  const [pathway, setPathway] = useState(null);
  const [userPathways, setUserPathways] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'info' });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [formData, setFormData] = useState({
    preferredCountry: '',
    desiredCourse: '',
    academicLevel: '',
    budget: '',
    targetCompany: '',
    currentGPA: '',
    englishProficiency: '',
    workExperience: ''
  });

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
        setShowForm(false);
        setPathway(pathways[0]);
      }
    } catch (error) {
      console.error('Error loading user pathways:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (subscriptionLoading) {
      setAlert({
        show: true,
        message: 'Loading your subscription details, please wait...',
        variant: 'info'
      });
      return;
    }
    
    if (!canPerformAction('useUniGuidePro')) {
      setAlert({
        show: true,
        message: 'You have reached your usage limit for UniGuidePro. Upgrade to Premium or Pro for more access.',
        variant: 'warning'
      });
      showUpgradePrompt('useUniGuidePro', () => setShowUpgradeModal(true));
      return;
    }
    
    setLoading(true);

    try {
      await trackUsage('useUniGuidePro');

      const userProfile = {
        userId: currentUser.uid,
        ...formData,
        budget: formData.budget ? parseInt(formData.budget) : null,
        currentGPA: formData.currentGPA ? parseFloat(formData.currentGPA) : null
      };

      const generatedPathway = await studyAbroadService.generatePathway(userProfile);
      setPathway(generatedPathway);
      setShowForm(false);
      setAlert({
        show: true,
        message: 'Your study abroad roadmap has been generated successfully!',
        variant: 'success'
      });
      
      await loadUserPathways();
    } catch (error) {
      console.error('Error generating pathway:', error);
      setAlert({
        show: true,
        message: 'Failed to generate pathway. Please try again.',
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    if (!canPerformAction('useUniGuidePro')) {
      setAlert({
        show: true,
        message: 'You have reached your usage limit for UniGuidePro. Upgrade for more access.',
        variant: 'warning'
      });
      showUpgradePrompt('useUniGuidePro', () => setShowUpgradeModal(true));
      return;
    }
    setShowForm(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Container className="mt-4" style={{ maxWidth: '1200px' }}>
      <HeroBanner 
        planType={planType}
        limits={limits}
        usage={usage}
        subscriptionLoading={subscriptionLoading}
        pathway={pathway}
        onGenerateNew={handleGenerateNew}
      />

      <UsageLimitAlert 
        alert={alert}
        setAlert={setAlert}
        planType={planType}
        subscriptionLoading={subscriptionLoading}
        setShowUpgradeModal={setShowUpgradeModal}
      />

      {showForm && (
        <PathwayForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          loading={loading}
          subscriptionLoading={subscriptionLoading}
          canPerformAction={canPerformAction}
          limits={limits}
          usage={usage}
          planType={planType}
          setShowUpgradeModal={setShowUpgradeModal}
        />
      )}

      {pathway && (
        <PathwayResults
          pathway={pathway}
          canPerformAction={canPerformAction}
          setAlert={setAlert}
          setShowUpgradeModal={setShowUpgradeModal}
          setShowModal={setShowModal}
          setSelectedStep={setSelectedStep}
          subscriptionLoading={subscriptionLoading}
          limits={limits}
          usage={usage}
          planType={planType}
          currentUser={currentUser}
        />
      )}

      <StepModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedStep={selectedStep}
        pathway={pathway}
        setPathway={setPathway}
        setAlert={setAlert}
        currentUser={currentUser}
      />
      
      {showUpgradeModal && (
        <SubscriptionPlans onClose={() => setShowUpgradeModal(false)} />
      )}
    </Container>
  );
};

export default UniGuidePro;
