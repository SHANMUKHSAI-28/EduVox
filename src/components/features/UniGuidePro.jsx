import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import studyAbroadService from '../../services/studyAbroadService';
import SubscriptionStatus from '../subscription/SubscriptionStatus';
import SubscriptionPlans from '../subscription/SubscriptionPlans';
import Button from '../common/Button';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Container, 
  Card, 
  Form, 
  Row, 
  Col, 
  Badge,
  ProgressBar,
  Accordion,
  Modal,
  ListGroup
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { 
  FaGlobeAmericas, 
  FaMapMarkedAlt, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaCrown,
  FaInfoCircle,
  FaUser,
  FaCalendarAlt,
  FaFlag,
  FaFileAlt,
  FaListUl
} from 'react-icons/fa';

const cardTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.5
};

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
  const [showForm, setShowForm] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [formData, setFormData] = useState({
    preferredCountry: '',
    desiredCourse: '',
    academicLevel: '',
    budget: '',
    currentGPA: '',
    englishProficiency: '',
    workExperience: ''
  });

  const canUseUniGuidePro = canPerformAction('useUniGuidePro');

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
        type: 'info',
        message: 'Loading your subscription details, please wait...'
      });
      return;
    }
    
    if (!canUseUniGuidePro) {
      setAlert({
        type: 'warning',
        message: 'You have reached your usage limit for UniGuidePro. Upgrade to Premium or Pro for more access.'
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
        type: 'success',
        message: 'Your study abroad roadmap has been generated successfully!'
      });
    } catch (error) {
      console.error('Error generating pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate pathway. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = async (stepNumber, status) => {
    try {
      const updatedPathway = {
        ...pathway,
        steps: pathway.steps.map(step => 
          step.step === stepNumber 
            ? { ...step, status, updatedAt: new Date().toISOString() }
            : step
        ),
        updatedAt: new Date().toISOString()
      };
      
      await studyAbroadService.saveUserPathway(currentUser.uid, updatedPathway);
      setPathway(updatedPathway);
      setAlert({
        type: 'success',
        message: `Step ${stepNumber} status updated to ${status}.`
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update step status. Please try again.'
      });
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-success" />;
      case 'in-progress':
        return <FaClock className="text-warning" />;
      case 'pending':
      default:
        return <FaExclamationTriangle className="text-secondary" />;
    }
  };

  const getStepVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getProgressPercentage = () => {
    if (!pathway?.steps) return 0;
    const completedSteps = pathway.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / pathway.steps.length) * 100;
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center py-5">
        <LoadingSpinner />
        <h3 className="text-2xl font-bold text-blue-600 mb-3 mt-3">
          Generating Your Study Abroad Pathway
        </h3>
        <p className="text-lg text-gray-600">
          Creating your personalized roadmap...
        </p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {alert && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)}
          className="mb-4"
        />
      )}

      <SubscriptionStatus />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardTransition}>
        <Card className="mb-4 shadow-lg border-0">
          <Card.Header className="bg-gradient-primary text-white">
            <Row className="align-items-center">
              <Col>
                <h2 className="mb-0 d-flex align-items-center">
                  <FaGlobeAmericas className="mr-3" />
                  UniGuidePro - AI Study Abroad Assistant
                </h2>
                <p className="mb-0 mt-2 opacity-90">
                  Get personalized study abroad roadmaps with AI-powered guidance
                </p>
              </Col>
              <Col xs="auto">
                <Badge variant="light" className="px-3 py-2">
                  <FaCrown className="mr-1" />
                  Premium Feature
                </Badge>
              </Col>
            </Row>
          </Card.Header>
        </Card>
      </motion.div>

      {showForm && (
        <Card className="mb-4 shadow">
          <Card.Header>
            <h4>
              <FaUser className="mr-2" />
              Tell us about your study abroad goals
            </h4>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Preferred Country</Form.Label>
                    <Form.Select
                      name="preferredCountry"
                      value={formData.preferredCountry}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="France">France</option>
                      <option value="Switzerland">Switzerland</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Desired Course/Field</Form.Label>
                    <Form.Control
                      type="text"
                      name="desiredCourse"
                      value={formData.desiredCourse}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science, Business Administration"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Level</Form.Label>
                    <Form.Select
                      name="academicLevel"
                      value={formData.academicLevel}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Level</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate (Master's)</option>
                      <option value="phd">PhD</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Budget (USD per year)</Form.Label>
                    <Form.Control
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="e.g., 50000"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current GPA</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="currentGPA"
                      value={formData.currentGPA}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.5"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>English Proficiency Level</Form.Label>
                    <Form.Select
                      name="englishProficiency"
                      value={formData.englishProficiency}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="native">Native</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Work Experience (years)</Form.Label>
                    <Form.Control
                      type="number"
                      name="workExperience"
                      value={formData.workExperience}
                      onChange={handleInputChange}
                      placeholder="e.g., 2"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="text-center">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  disabled={loading || subscriptionLoading || (!subscriptionLoading && !canPerformAction('useUniGuidePro'))}
                >
                  {subscriptionLoading ? 'Loading...' : loading ? 'Generating...' : 'Generate My Roadmap'}
                </Button>
                
                {!subscriptionLoading && limits && limits.uniGuideProUsage !== -1 && (
                  <div className="mt-2 small text-muted">
                    {Math.max(0, limits.uniGuideProUsage - (usage?.uniGuideProUsage || 0))} uses remaining
                    {planType === 'free' && (
                      <span> - <a href="#" onClick={(e) => {
                        e.preventDefault();
                        setShowUpgradeModal(true);
                      }}>Upgrade for more</a></span>
                    )}
                  </div>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {pathway && (
        <div>
          <Card className="mb-4">
            <Card.Header>
              <h4>
                <FaMapMarkedAlt className="mr-2" />
                Your Study Abroad Journey to {pathway.country}
              </h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6>Overall Progress</h6>
                  <ProgressBar 
                    now={getProgressPercentage()} 
                    label={`${Math.round(getProgressPercentage())}%`}
                    className="mb-3"
                  />
                  <p><strong>Course:</strong> {pathway.course}</p>
                  <p><strong>Academic Level:</strong> {pathway.academicLevel}</p>
                </Col>
                <Col md={4}>
                  <h6>Quick Stats</h6>
                  <p><strong>Total Steps:</strong> {pathway.steps?.length || 0}</p>
                  <p><strong>Completed:</strong> {pathway.steps?.filter(s => s.status === 'completed').length || 0}</p>
                  <p><strong>In Progress:</strong> {pathway.steps?.filter(s => s.status === 'in-progress').length || 0}</p>
                  <p><strong>Pending:</strong> {pathway.steps?.filter(s => s.status === 'pending').length || 0}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5>Step-by-Step Roadmap</h5>
            </Card.Header>
            <Card.Body>
              <Accordion defaultActiveKey="0">
                {(pathway.steps || []).map((step, index) => (
                  <Accordion.Item eventKey={index.toString()} key={step.step}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center w-100">
                        <span className="mr-3">{getStepIcon(step.status)}</span>
                        <span className="mr-3">Step {step.step}: {step.title}</span>
                        <Badge variant={getStepVariant(step.status)} className="ml-auto mr-3">
                          {step.status}
                        </Badge>
                        <small className="text-muted">{step.duration}</small>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p>{step.description}</p>
                      <div className="mt-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedStep(step);
                            setShowModal(true);
                          }}
                        >
                          View Details & Update Status
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>

          {/* Usage Information */}
          {!subscriptionLoading && limits && limits.uniGuideProUsage !== -1 && (
            <Card className="mb-4 border-info">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <FaInfoCircle className="mr-2" />
                  UniGuidePro Usage Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <p><strong>Current Plan:</strong> {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                    <p><strong>Uses Remaining:</strong> {Math.max(0, limits.uniGuideProUsage - (usage?.uniGuideProUsage || 0))} of {limits.uniGuideProUsage}</p>
                    {planType === 'free' && (
                      <div>
                        <p>Upgrade to Premium for 10 uses per month, or Pro for unlimited access.</p>
                        <Button 
                          variant="outline-info"
                          size="sm"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          View Subscription Options
                        </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {/* Step Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            {selectedStep && getStepIcon(selectedStep.status)}
            <span className="ml-2">
              Step {selectedStep?.step}: {selectedStep?.title}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStep && (
            <>
              <div className="mb-3">
                <h6><FaInfoCircle className="mr-2" />Description:</h6>
                <p>{selectedStep.description}</p>
              </div>

              <div className="mb-3">
                <h6><FaCalendarAlt className="mr-2" />Duration:</h6>
                <p>{selectedStep.duration}</p>
              </div>

              <div className="mb-3">
                <h6><FaFlag className="mr-2" />Status:</h6>
                <Badge variant={getStepVariant(selectedStep.status)}>
                  {selectedStep.status}
                </Badge>
              </div>

              <div className="mt-4">
                <h6>Update Status:</h6>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateStepStatus(selectedStep.step, 'pending')}
                    disabled={selectedStep.status === 'pending'}
                  >
                    Mark Pending
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => updateStepStatus(selectedStep.step, 'in-progress')}
                    disabled={selectedStep.status === 'in-progress'}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => updateStepStatus(selectedStep.step, 'completed')}
                    disabled={selectedStep.status === 'completed'}
                  >
                    Mark Completed
                  </Button>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Subscription Plans Modal */}
      {showUpgradeModal && (
        <SubscriptionPlans onClose={() => setShowUpgradeModal(false)} />
      )}
    </Container>
  );
};

export default UniGuidePro;
  FaHome,
  FaBriefcase,
  FaLanguage
} from 'react-icons/fa';

// Custom CSS for animations and styling
const cardTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.5
};

const UniGuidePro = () => {
  const { currentUser } = useAuth();
  const { 
    canPerformAction, 
    getRemainingCount,
    trackUsage, 
    showUpgradePrompt, 
    limits, 
    usage, 
    planType,
    loading: subscriptionLoading 
  } = useSubscriptionLimits();
  
  const [loading, setLoading] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [pathway, setPathway] = useState(null);
  const [userPathways, setUserPathways] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState(null);
  const [profileHash, setProfileHash] = useState(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

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

  // Memoize permission checks
  const canUseUniGuidePro = useMemo(() => {
    if (subscriptionLoading) return false;
    return canPerformAction('useUniGuidePro');
  }, [canPerformAction, planType, subscriptionLoading]);

  const canUseDetailedAnalysis = useMemo(() => {
    if (subscriptionLoading) return false;
    return canPerformAction('useMyStudyPath');
  }, [canPerformAction, planType, subscriptionLoading]);

  const profileHashKey = `profile-hash-${currentUser?.uid}`;  // Enhanced effect to load user profile and pathway on mount
  useEffect(() => {
    if (currentUser && !subscriptionLoading && !userProfile) {
      loadUserProfile();
    }
  }, [currentUser, subscriptionLoading, userProfile]);

  // Load user profile function with enhanced profile management
  const loadUserProfile = async () => {
    try {
      const profile = await academicProfileService.getAcademicProfile(currentUser.uid);
      setUserProfile(profile);
      
      if (profile && isProfileComplete(profile)) {
        // Generate hash of current profile preferences
        const currentProfileHash = generateProfileHash(profile);
        
        // Check subscription before loading existing pathway
        if (canUseUniGuidePro) {
          // Check for profile changes and load pathway accordingly
          if (!pathway || (profileHash && profileHash !== currentProfileHash)) {
            console.log('🔄 Profile preferences changed or first load, checking for updates...');
            
            // Check if user has a detailed pathway that needs updating
            const selectedPathway = await studyAbroadService.getSelectedPathway(currentUser.uid);
            if (selectedPathway && canUseDetailedAnalysis) {
              console.log('📋 Found selected pathway, checking for detailed analysis...');
              await generateDetailedAnalysis(selectedPathway, profile);
              setProfileHash(currentProfileHash);
              return;
            }
            
            // Load existing pathway or generate new one
            await loadExistingPathway(profile, currentProfileHash !== profileHash);
          } else {
            console.log('✅ Profile unchanged, using existing pathway');
            if (!pathway) {
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
          console.log('❌ UniGuidePro: User cannot access pathway, subscription required');
          setAlert({
            type: 'warning',
            message: 'Upgrade to access AI-powered study abroad pathways.'
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

  // Check if profile is complete
  const isProfileComplete = (profile) => {
    return profile && 
           profile.preferred_countries && 
           profile.preferred_countries.length > 0 &&
           profile.preferred_fields_of_study && 
           profile.preferred_fields_of_study.length > 0 &&
           profile.education_level;
  };

  // Load existing pathway or generate new one
  const loadExistingPathway = async (profile, forceRegenerate = false) => {
    try {
      // Try to load existing pathway first
      const pathways = await studyAbroadService.getUserPathways(currentUser.uid);
      setUserPathways(pathways);
      
      if (pathways.length > 0 && !forceRegenerate) {
        setPathway(pathways[0]);
        setShowForm(false);
        setAlert({
          type: 'success',
          message: 'Your existing study abroad pathway has been loaded.'
        });
      } else {
        // Generate new pathway from profile
        await generatePathwayFromProfile(profile);
      }
    } catch (error) {
      console.error('Error loading existing pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load pathway. Please try again.'
      });
    }
  };  // Generate pathway from user profile
  const generatePathwayFromProfile = async (profile) => {
    if (!canUseUniGuidePro) {
      showUpgradePrompt('useUniGuidePro', () => setShowUpgradeModal(true));
      return;
    }

    setGeneratingPath(true);
    setAlert({
      type: 'info',
      message: 'Generating your personalized study abroad pathway...',
      icon: <FaSync className="animate-spin" />
    });

    try {
      await trackUsage('useUniGuidePro');

      const userProfile = {
        userId: currentUser.uid,
        preferredCountry: profile.preferred_countries?.[0] || '',
        desiredCourse: profile.preferred_fields_of_study?.[0] || '',
        academicLevel: profile.education_level || '',
        budget: profile.budget_max ? profile.budget_max.toString() : '',
        currentGPA: profile.gpa ? profile.gpa.toString() : '',
        englishProficiency: profile.english_proficiency || '',
        workExperience: profile.work_experience || '0'
      };

      const generatedPathway = await studyAbroadService.generatePathway(userProfile);
      setPathway(generatedPathway);
      setShowForm(false);
      setAlert({
        type: 'success',
        message: 'Your study abroad pathway has been generated! Upgrade for detailed AI analysis.'
      });
      
      await loadUserPathways();
    } catch (error) {
      console.error('Error generating pathway from profile:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate pathway. Please try again.'
      });
    } finally {
      setGeneratingPath(false);
    }
  };

  // Generate detailed AI analysis (enhanced MyStudyPath functionality)
  const generateDetailedAnalysis = async (selectedPathway, profile) => {
    if (!canUseDetailedAnalysis) {
      showUpgradePrompt('useMyStudyPath', () => setShowUpgradeModal(true));
      return;
    }

    setGeneratingPath(true);
    setAlert({
      type: 'info',
      message: 'Generating comprehensive AI-powered analysis...',
      icon: <FaSync className="animate-spin" />
    });

    try {
      await trackUsage('useMyStudyPath');

      // Import PathwayScrapingService for AI generation
      const pathwayScrapingService = (await import('../../services/pathwayScrapingService.js')).default;
      
      // Create detailed profile for AI analysis
      const detailedProfile = {
        country: selectedPathway.country || profile.preferred_countries?.[0] || 'USA',
        course: selectedPathway.course || profile.preferred_fields_of_study?.[0] || 'Computer Science',
        academicLevel: selectedPathway.academicLevel || profile.education_level || 'Master',
        nationality: profile.nationality || 'Indian',
        budgetRange: {
          name: profile.budget_min && profile.budget_max ? 
            (profile.budget_max > 50000 ? 'High' : profile.budget_max > 25000 ? 'Medium' : 'Low') : 'Medium',
          min: profile.budget_min || 25000,
          max: profile.budget_max || 75000
        }
      };

      // Generate comprehensive pathway using AI
      const detailedPathwayData = await pathwayScrapingService.generatePathwayWithAI(detailedProfile);
      
      if (detailedPathwayData) {
        // Transform AI response to our pathway structure
        const enhancedPathway = {
          ...selectedPathway,
          id: `uniguidepro_detailed_${Date.now()}`,
          type: 'detailed_ai_analysis',
          source: 'uniguidepro_ai',
          updatedAt: new Date().toISOString(),
          
          // Enhanced data from AI
          universities: detailedPathwayData.universities || [],
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
          
          // Enhanced steps with AI data
          steps: detailedPathwayData.timeline ? detailedPathwayData.timeline.map((timelineItem, index) => ({
            step: index + 1,
            title: timelineItem.month || `Step ${index + 1}`,
            description: timelineItem.tasks?.join(', ') || 'Complete tasks for this phase',
            duration: '1 month',
            status: 'pending',
            tasks: timelineItem.tasks || [],
            priority: timelineItem.priority || 'medium',
            documents: timelineItem.documents || 'Review required documents'
          })) : selectedPathway.steps || []
        };

        // Save the enhanced pathway
        await studyAbroadService.saveUserPathway(currentUser.uid, enhancedPathway);
        setPathway(enhancedPathway);
        setShowDetailedView(true);
        setShowForm(false);
        
        setAlert({
          type: 'success',
          message: 'Comprehensive AI analysis completed! Your detailed pathway is ready.'
        });
        
        await loadUserPathways();
      }
    } catch (error) {
      console.error('Error generating detailed analysis:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate detailed analysis. Please try again.'
      });
    } finally {
      setGeneratingPath(false);
    }
  };

  const loadUserPathways = async () => {
    try {
      const pathways = await studyAbroadService.getUserPathways(currentUser.uid);
      setUserPathways(pathways);
      if (pathways.length > 0 && !pathway) {
        setPathway(pathways[0]);
        setShowForm(false);
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
    
    // Debug logging
    console.log('🎓 UniGuidePro handleSubmit - Debug Info:', {
      limits,
      usage,
      planType,
      subscriptionLoading
    });
    
    // Wait for subscription data to load
    if (subscriptionLoading) {
      console.log('⏳ UniGuidePro: Subscription data still loading, please wait...');
      setAlert({
        type: 'info',
        message: 'Loading your subscription details, please wait...'
      });
      return;
    }
    
    // Check if the user can use UniGuidePro
    if (!canUseUniGuidePro) {
      console.log('⚠️ UniGuidePro: Usage limit reached');
      setAlert({
        type: 'warning',
        message: 'You have reached your usage limit for UniGuidePro. Upgrade to Premium or Pro for more access.'
      });
      showUpgradePrompt('useUniGuidePro', () => setShowUpgradeModal(true));
      return;
    }
    
    console.log('✅ UniGuidePro: Proceeding with generation...');
    setGeneratingPath(true);

    try {
      // Track usage
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
        type: 'success',
        message: 'Your study abroad roadmap has been generated! Upgrade for detailed AI analysis.'
      });
      
      // Reload user pathways
      await loadUserPathways();
    } catch (error) {
      console.error('Error generating pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to generate pathway. Please try again.'
      });
    } finally {
      setGeneratingPath(false);
    }
  };

  // Enhanced step management functions
  const updateStepStatus = async (stepNumber, status, notes = '') => {
    try {
      const updatedPathway = {
        ...pathway,
        steps: pathway.steps.map(step => 
          step.step === stepNumber 
            ? { ...step, status, notes, updatedAt: new Date().toISOString() }
            : step
        ),
        updatedAt: new Date().toISOString()
      };
      
      await studyAbroadService.saveUserPathway(currentUser.uid, updatedPathway);
      setPathway(updatedPathway);
      setAlert({
        type: 'success',
        message: `Step ${stepNumber} status updated to ${status}.`
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update step status. Please try again.'
      });
    }
  };

  // Get step status icon
  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'in-progress':
        return <FaClock className="text-yellow-500" />;
      case 'pending':
      default:
        return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!pathway?.steps || pathway.steps.length === 0) return 0;
    const completedSteps = pathway.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / pathway.steps.length) * 100);
  };

  // Generate detailed analysis for existing pathway
  const generateDetailedAnalysisForPathway = async () => {
    if (!canUseDetailedAnalysis) {
      showUpgradePrompt('useMyStudyPath', () => setShowUpgradeModal(true));
      return;
    }

    if (!pathway || !userProfile) {
      setAlert({
        type: 'error',
        message: 'No pathway or profile found. Please generate a pathway first.'
      });
      return;
    }

    await generateDetailedAnalysis(pathway, userProfile);
  };
      await studyAbroadService.updateStepStatus(
        currentUser.uid,
        pathway.id,
        stepNumber,
        status,
        notes
      );
      
      // Update local state - handle both old and new pathway data structures
      const currentSteps = pathway.data?.steps || pathway.steps || [];
      const updatedSteps = currentSteps.map(step => {
        if (step.step === stepNumber) {
          return {
            ...step,
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : null,
            notes
          };
        }
        return step;
      });

      // Update pathway with appropriate structure
      if (pathway.data) {
        setPathway({
          ...pathway,
          data: { ...pathway.data, steps: updatedSteps }
        });
      } else {
        setPathway({
          ...pathway,
          steps: updatedSteps
        });
      }

      setAlert({
        show: true,
        message: `Step ${stepNumber} status updated successfully!`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      setAlert({
        show: true,
        message: 'Failed to update step status.',
        variant: 'danger'
      });
    }
  };
  const getProgressPercentage = () => {
    if (!pathway) return 0;
    
    // Handle both old and new pathway data structures
    const steps = pathway.data?.steps || pathway.steps || [];
    if (steps.length === 0) return 0;
    
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getStepVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-success" />;
      case 'in-progress': return <FaClock className="text-warning" />;
      case 'pending': return <FaExclamationTriangle className="text-secondary" />;
      default: return <FaClock className="text-secondary" />;
    }
  };

  const StepModal = () => (
    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Step {selectedStep?.step}: {selectedStep?.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedStep && (
          <>
            <p><strong>Description:</strong> {selectedStep.description}</p>
            <p><strong>Duration:</strong> {selectedStep.duration}</p>
            <p><strong>Status:</strong> 
              <Badge variant={getStepVariant(selectedStep.status)} className="ml-2">
                {selectedStep.status}
              </Badge>
            </p>
            
            <h6>Tasks:</h6>
            <ListGroup>
              {selectedStep.tasks.map((task, index) => (
                <ListGroup.Item key={index}>{task}</ListGroup.Item>
              ))}
            </ListGroup>

            {selectedStep.notes && (
              <div className="mt-3">
                <h6>Notes:</h6>
                <p>{selectedStep.notes}</p>
              </div>
            )}

            <div className="mt-4">
              <h6>Update Status:</h6>
              <div className="d-flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStepStatus(selectedStep.step, 'pending')}
                >
                  Mark Pending
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => updateStepStatus(selectedStep.step, 'in-progress')}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => updateStepStatus(selectedStep.step, 'completed')}
                >
                  Mark Completed
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );  // Enhanced loading component
  if (loading || generatingPath) {
    return (
      <Container className="mt-4 text-center py-5">
        <div className="bg-white rounded-lg shadow-lg p-5">
          <div className="flex justify-center mb-4">
            <div className="animate-spin relative">
              <FaGlobeAmericas className="text-blue-600" size={50} style={{ animation: 'pulse 2s infinite' }} />
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 border-opacity-50 animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-blue-600 mb-3">
            {generatingPath ? 'Building Your Global Journey' : 'Loading UniGuidePro'}
          </h3>
          <p className="text-lg text-gray-600 mb-4">
            {generatingPath ? 'Crafting your personalized study abroad roadmap...' : 'Preparing your pathway dashboard...'}
          </p>
          
          <div className="w-3/4 mx-auto">
            <ProgressBar animated now={75} variant="info" className="h-2 rounded-full" />
          </div>
          
          <div className="mt-4 grid grid-cols-4 gap-4">
            {['Analyzing preferences', 'Finding opportunities', 'Mapping journey', 'Creating timeline'].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${i <= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs text-gray-500">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  // Enhanced StepModal component with detailed information
  const StepModal = () => (
    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {getStepIcon(selectedStep?.status)}
          <span className="ml-2">
            Step {selectedStep?.step}: {selectedStep?.title}
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedStep && (
          <>
            <div className="mb-3">
              <h6><FaInfoCircle className="mr-2" />Description:</h6>
              <p>{selectedStep.description}</p>
            </div>

            <div className="mb-3">
              <h6><FaCalendarAlt className="mr-2" />Duration:</h6>
              <p>{selectedStep.duration}</p>
            </div>

            <div className="mb-3">
              <h6><FaFlag className="mr-2" />Status:</h6>
              <Badge variant={getStepVariant(selectedStep.status)}>
                {selectedStep.status}
              </Badge>
            </div>

            {selectedStep.tasks && selectedStep.tasks.length > 0 && (
              <div className="mb-3">
                <h6><FaListUl className="mr-2" />Tasks:</h6>
                <ListGroup variant="flush">
                  {selectedStep.tasks.map((task, index) => (
                    <ListGroup.Item key={index} className="border-0 px-0">
                      <FaCheckCircle className="text-muted mr-2" size="sm" />
                      {task}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {selectedStep.documents && (
              <div className="mb-3">
                <h6><FaFileAlt className="mr-2" />Required Documents:</h6>
                <p className="text-muted">{selectedStep.documents}</p>
              </div>
            )}

            {selectedStep.notes && (
              <div className="mb-3">
                <h6><FaBell className="mr-2" />Notes:</h6>
                <p className="text-muted">{selectedStep.notes}</p>
              </div>
            )}

            <div className="mt-4">
              <h6>Update Status:</h6>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStepStatus(selectedStep.step, 'pending')}
                  disabled={selectedStep.status === 'pending'}
                >
                  Mark Pending
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => updateStepStatus(selectedStep.step, 'in-progress')}
                  disabled={selectedStep.status === 'in-progress'}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => updateStepStatus(selectedStep.step, 'completed')}
                  disabled={selectedStep.status === 'completed'}
                >
                  Mark Completed
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
                    <Form.Select
                      name="preferredCountry"
                      value={formData.preferredCountry}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="France">France</option>
                      <option value="Switzerland">Switzerland</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Desired Course/Field</Form.Label>
                    <Form.Control
                      type="text"
                      name="desiredCourse"
                      value={formData.desiredCourse}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science, Business Administration"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Level</Form.Label>
                    <Form.Select
                      name="academicLevel"
                      value={formData.academicLevel}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Level</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate (Master's)</option>
                      <option value="phd">PhD</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Budget (USD per year)</Form.Label>
                    <Form.Control
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="e.g., 50000"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current GPA</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="currentGPA"
                      value={formData.currentGPA}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.5"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>English Proficiency Level</Form.Label>
                    <Form.Select
                      name="englishProficiency"
                      value={formData.englishProficiency}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="native">Native</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Work Experience (years)</Form.Label>
                    <Form.Control
                      type="number"
                      name="workExperience"
                      value={formData.workExperience}
                      onChange={handleInputChange}
                      placeholder="e.g., 2"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Target Company (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="targetCompany"
                      value={formData.targetCompany}
                      onChange={handleInputChange}
                      placeholder="e.g., Google, Microsoft"
                    />
                  </Form.Group>
                </Col>
              </Row>              <div className="text-center">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  disabled={loading || subscriptionLoading || (!subscriptionLoading && !canPerformAction('useUniGuidePro'))}
                >
                  {subscriptionLoading ? 'Loading...' : loading ? 'Generating...' : 'Generate My Roadmap'}
                </Button>
                
                {!subscriptionLoading && limits && limits.uniGuideProUsage !== -1 && (
                  <div className="mt-2 small text-muted">
                    {Math.max(0, limits.uniGuideProUsage - (usage?.uniGuideProUsage || 0))} uses remaining
                    {planType === 'free' && (
                      <span> - <a href="#" onClick={(e) => {
                        e.preventDefault();
                        setShowUpgradeModal(true);
                      }}>Upgrade for more</a></span>
                    )}
                  </div>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {pathway && (
        <div>
          {/* Progress Overview */}
          <Card className="mb-4">
            <Card.Header>
              <h4>
                <FaMapMarkedAlt className="mr-2" />
                Your Study Abroad Journey to {pathway.country}
              </h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6>Overall Progress</h6>
                  <ProgressBar 
                    now={getProgressPercentage()} 
                    label={`${Math.round(getProgressPercentage())}%`}
                    className="mb-3"                  />
                  <p><strong>Course:</strong> {pathway.course}</p>
                  <p><strong>Academic Level:</strong> {pathway.academicLevel}</p>
                  <p><strong>Estimated Timeline:</strong> {
                    pathway.data?.timeline?.totalDuration || 
                    pathway.timeline?.totalDuration || 
                    'Not specified'
                  }</p>
                </Col>                <Col md={4}>                  <h6>Quick Stats</h6>
                  <p><strong>Total Steps:</strong> {(pathway.data?.steps || pathway.steps || []).length}</p>
                  <p><strong>Completed:</strong> {(pathway.data?.steps || pathway.steps || []).filter(s => s.status === 'completed').length}</p>
                  <p><strong>In Progress:</strong> {(pathway.data?.steps || pathway.steps || []).filter(s => s.status === 'in-progress').length}</p>
                  <p><strong>Pending:</strong> {(pathway.data?.steps || pathway.steps || []).filter(s => s.status === 'pending').length}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Roadmap Steps */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Step-by-Step Roadmap</h5>
            </Card.Header>            <Card.Body>
              <Accordion defaultActiveKey="0">
                {(pathway.data?.steps || pathway.steps || []).map((step, index) => (
                  <Accordion.Item eventKey={index.toString()} key={step.step}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center w-100">
                        <span className="mr-3">{getStepIcon(step.status)}</span>
                        <span className="mr-3">Step {step.step}: {step.title}</span>
                        <Badge variant={getStepVariant(step.status)} className="ml-auto mr-3">
                          {step.status}
                        </Badge>
                        <small className="text-muted">{step.duration}</small>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p>{step.description}</p>
                      <h6>Tasks:</h6>
                      <ul>
                        {step.tasks?.map((task, taskIndex) => (
                          <li key={taskIndex}>{task}</li>
                        ))}
                      </ul>
                      <div className="mt-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedStep(step);
                            setShowModal(true);
                          }}
                        >
                          View Details & Update Status
                        </Button>
                      </div>                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>

          {/* Additional Information Tabs */}
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>
                    <FaMoneyBillWave className="mr-2" />
                    Cost Breakdown
                  </h5>
                </Card.Header>                <Card.Body>
                  {/* Handle both old and new pathway data structures for costs */}
                  {(() => {
                    const costs = pathway.data?.costs || pathway.costs;
                    if (!costs) {
                      return <p>Cost information not available</p>;
                    }
                    
                    // Handle new AI scraping data structure
                    if (typeof costs.tuition === 'string') {
                      return (
                        <>
                          <p><strong>Tuition:</strong> {costs.tuition || 'Not available'}</p>
                          <p><strong>Living Expenses:</strong> {costs.living || 'Not available'}</p>
                          <p><strong>Insurance:</strong> {costs.insurance || 'Not available'}</p>
                          <p><strong>Other Expenses:</strong> {costs.other || 'Not available'}</p>
                        </>
                      );
                    }
                    
                    // Handle old data structure
                    return (
                      <>
                        <p><strong>Tuition:</strong> {costs.tuition ? `${costs.tuition.currency} ${costs.tuition.min?.toLocaleString()} - ${costs.tuition.max?.toLocaleString()}` : 'Not available'}</p>
                        <p><strong>Living Expenses:</strong> {costs.living ? `${costs.living.currency} ${costs.living.min?.toLocaleString()} - ${costs.living.max?.toLocaleString()}` : 'Not available'}</p>
                        <p><strong>Total Estimated:</strong> {costs.total ? `${costs.total.currency} ${costs.total.min?.toLocaleString()} - ${costs.total.max?.toLocaleString()}` : 'Not available'}</p>
                      </>
                    );
                  })()}
                  
                  {pathway.budgetAlignment && (
                    <Alert variant={pathway.budgetAlignment.status === 'excellent' ? 'success' : 
                                   pathway.budgetAlignment.status === 'good' ? 'warning' : 'danger'}>
                      {pathway.budgetAlignment.message}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Visa Information</h5>
                </Card.Header>                <Card.Body>
                  {/* Handle both old and new pathway data structures for visa */}
                  {(() => {
                    const visaInfo = pathway.data?.visaRequirements || pathway.visaInfo || pathway.visa;
                    if (!visaInfo) {
                      return <p>Visa information not available</p>;
                    }
                    
                    return (
                      <>
                        <p><strong>Visa Type:</strong> {visaInfo.type || 'Not available'}</p>
                        <p><strong>Processing Time:</strong> {visaInfo.processingTime || 'Not available'}</p>
                        <p><strong>Fee:</strong> {visaInfo.fee || 'Not available'}</p>
                        <p><strong>Work Permissions:</strong> {visaInfo.workPermissions || 'Not available'}</p>
                      </>
                    );
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Universities and Scholarships */}
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Recommended Universities</h5>
                </Card.Header>                <Card.Body>
                  {/* Handle both old and new pathway data structures for universities */}
                  {(() => {
                    const universities = pathway.data?.universities || pathway.universities || [];
                    if (universities.length === 0) {
                      return <p>No university recommendations available</p>;
                    }
                    
                    return universities.slice(0, 5).map((university, index) => (
                      <div key={index} className="mb-2">
                        <strong>{university.name}</strong>
                        {university.ranking && (
                          <Badge variant="primary" className="ml-2">
                            {university.ranking}
                          </Badge>
                        )}
                        <br />
                        <small className="text-muted">
                          {university.location} • {university.tuition || university.tuitionFee}
                        </small>
                      </div>
                    ));
                  })()}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Scholarship Opportunities</h5>
                </Card.Header>                <Card.Body>
                  {/* Handle both old and new pathway data structures for scholarships */}
                  {(() => {
                    const scholarships = pathway.data?.scholarships || pathway.scholarships || [];
                    if (scholarships.length === 0) {
                      return <p>No scholarship opportunities available</p>;
                    }
                    
                    return scholarships.slice(0, 3).map((scholarship, index) => (
                      <div key={index} className="mb-2">
                        <strong>{scholarship.name}</strong>
                        <br />
                        <small className="text-muted">
                          {scholarship.amount} • {scholarship.eligibility}
                        </small>
                        {scholarship.deadline && (
                          <small className="text-info d-block">
                            Deadline: {scholarship.deadline}
                          </small>
                        )}
                      </div>
                    ));
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Country Tips */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Country-Specific Tips for {pathway.country}</h5>
            </Card.Header>            <Card.Body>
              <ul>
                {/* Handle both old and new pathway data structures for tips */}
                {(() => {
                  const tips = pathway.data?.tips || pathway.tips || [];
                  if (tips.length === 0) {
                    return <li>No specific tips available for this country</li>;
                  }
                  
                  return tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ));
                })()}              </ul>
            </Card.Body>
          </Card>          {/* Usage Information */}
          {!subscriptionLoading && limits && limits.uniGuideProUsage !== -1 && (
            <Card className="mb-4 border-info">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <FaInfoCircle className="mr-2" />
                  UniGuidePro Usage Information
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col>
                    <p><strong>Current Plan:</strong> {planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                    <p><strong>Uses Remaining:</strong> {Math.max(0, limits.uniGuideProUsage - (usage?.uniGuideProUsage || 0))} of {limits.uniGuideProUsage}</p>
                    {planType === 'free' && (
                      <div>
                        <p>Upgrade to Premium for 10 uses per month, or Pro for unlimited access.</p>
                        <Button 
                          variant="outline-info"
                          size="sm"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          View Subscription Options
                        </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
          
          {/* Detailed Analysis CTA */}
          <Card className="mb-4 border-2 border-warning">
            <Card.Header className="bg-gradient text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <h5 className="mb-0">
                <FaCrown className="mr-2" />
                Get Detailed AI-Powered Analysis
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6 className="text-primary">Unlock Complete Study Abroad Guidance</h6>
                  <ul className="text-muted mb-3">
                    <li>📋 Detailed document checklist with deadlines</li>
                    <li>💰 Exact cost breakdown by city and university</li>
                    <li>🏠 Living cost analysis and accommodation options</li>
                    <li>📝 Visa requirements and application timeline</li>
                    <li>🎓 University recommendations based on your profile</li>
                    <li>🤖 AI-powered personalized roadmap</li>
                  </ul>
                  <p className="small text-muted">
                    Our AI will analyze your complete profile and create a detailed, 
                    step-by-step plan tailored specifically for your goals.
                  </p>
                </Col>
                <Col md={4} className="text-center">                  <Button
                    size="lg"
                    className="btn-gradient px-4 py-2"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white'
                    }}
                    onClick={async () => {
                      if (!canPerformAction('useMyStudyPath')) {
                        setAlert({
                          show: true,
                          message: 'Upgrade to Premium to access detailed AI-powered analysis!',
                          variant: 'warning'
                        });
                        setShowUpgradeModal(true);
                        return;
                      }
                      
                      try {
                        // Save the current pathway for detailed analysis
                        await studyAbroadService.saveSelectedPathway(currentUser.uid, pathway);
                        
                        setAlert({
                          show: true,
                          message: 'Pathway selected! Redirecting to detailed AI analysis...',
                          variant: 'success'
                        });
                        
                        // Navigate to detailed analysis after a short delay
                        setTimeout(() => {
                          window.location.href = '/my-study-abroad-path';
                        }, 1500);
                      } catch (error) {
                        console.error('Error saving selected pathway:', error);
                        setAlert({
                          show: true,
                          message: 'Failed to save pathway. Please try again.',
                          variant: 'danger'
                        });
                      }
                    }}
                  >
                    <FaCrown className="mr-2" />
                    Select for Detailed Analysis
                  </Button>
                  <div className="mt-2">
                    <Badge variant="warning" className="px-3 py-1">
                      Premium Feature
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}
      <StepModal />
      
      {/* Keep Subscription Plans Modal but only used for MyStudyPath access */}
      {showUpgradeModal && (
        <SubscriptionPlans onClose={() => setShowUpgradeModal(false)} />
      )}
    </Container>
  );
};

export default UniGuidePro;
