import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import studyAbroadService from '../../services/studyAbroadService';
import SubscriptionStatus from '../subscription/SubscriptionStatus';
import SubscriptionPlans from '../subscription/SubscriptionPlans';
import './UniGuidePro.css';
import { 
  Container, 
  Card, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Spinner, 
  Badge,
  ProgressBar,
  Accordion,
  Modal,
  ListGroup
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { 
  FaGlobeAmericas, 
  FaGraduationCap, 
  FaMapMarkedAlt, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaCrown,
  FaInfoCircle,
  FaUniversity,
  FaIdCard,
  FaPlaneDeparture,
  FaLightbulb,
  FaChartLine,
  FaStar,
  FaRegBookmark
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
  
  // Show usage limit information when subscription data loads
  useEffect(() => {
    if (!subscriptionLoading && limits && usage) {
      // Display usage information based on subscription plan
      if (limits.uniGuideProUsage !== -1) {
        const usesRemaining = limits.uniGuideProUsage - (usage.uniGuideProUsage || 0);
        
        if (usesRemaining > 0) {
          setAlert({
            show: true,
            message: `You have ${usesRemaining} UniGuidePro ${usesRemaining === 1 ? 'use' : 'uses'} remaining this month. Upgrade for more access.`,
            variant: 'info'
          });
        } else if (usesRemaining <= 0) {
          setAlert({
            show: true,
            message: 'You have reached your UniGuidePro usage limit. Upgrade to Premium or Pro for more access.',
            variant: 'warning'
          });
        }
      }
    }
  }, [subscriptionLoading, limits, usage]);

  const loadUserPathways = async () => {
    try {
      const pathways = await studyAbroadService.getUserPathways(currentUser.uid);
      setUserPathways(pathways);
      if (pathways.length > 0) {
        setShowForm(false);
        setPathway(pathways[0]); // Show most recent pathway
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
  };  const handleSubmit = async (e) => {
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
        show: true,
        message: 'Loading your subscription details, please wait...',
        variant: 'info'
      });
      return;
    }
    
    // Check if the user can use UniGuidePro based on their subscription plan
    if (!canPerformAction('useUniGuidePro')) {
      console.log('⚠️ UniGuidePro: Usage limit reached');
      setAlert({
        show: true,
        message: 'You have reached your usage limit for UniGuidePro. Upgrade to Premium or Pro for more access.',
        variant: 'warning'
      });
      showUpgradePrompt('useUniGuidePro', () => setShowUpgradeModal(true));
      return;
    }
    
    // User has access to UniGuidePro
    console.log('✅ UniGuidePro: Proceeding with generation...');
    setLoading(true);

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
        show: true,
        message: 'Your basic study abroad roadmap has been generated! Upgrade for detailed analysis.',
        variant: 'success'
      });
      
      // Reload user pathways
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
  const updateStepStatus = async (stepNumber, status, notes = '') => {
    try {
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
  );
  if (loading) {
    return (
      <Container className="mt-4 text-center py-5">
        <div className="bg-white rounded-lg shadow-lg p-5">
          <div className="flex justify-center mb-4">
            <div className="animate-spin relative">
              <FaGlobeAmericas className="text-blue-600" size={50} style={{ animation: 'pulse 2s infinite' }} />
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 border-opacity-50 animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-blue-600 mb-3">Building Your Global Journey</h3>
          <p className="text-lg text-gray-600 mb-4">Crafting your personalized study abroad roadmap...</p>
          
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
    return (
    <Container className="mt-4">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 md:p-8 text-white relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <div className="absolute w-40 h-40 rounded-full bg-white top-0 right-0"></div>
            <div className="absolute w-20 h-20 rounded-full bg-blue-300 top-10 right-32"></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center">
                <div className="mr-4 p-2 bg-white bg-opacity-20 rounded-full">
                  <FaGlobeAmericas className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">UniGuidePro</h1>
                  {!loading && !subscriptionLoading && planType === 'free' && (
                    <Badge 
                      bg="warning" 
                      className="ml-1 px-2 py-1 rounded-lg" 
                      style={{ fontSize: '0.6em', verticalAlign: 'middle' }}
                    >
                      Trial Version
                    </Badge>
                  )}
                </div>
              </div>              <p className="text-blue-100 mt-2 text-lg font-light">Your AI-powered study abroad journey planner</p>
              {!loading && !subscriptionLoading && limits && (
                <div className="mt-1">
                  {limits.uniGuideProUsage === -1 ? (
                    <Badge variant="success" className="py-1 px-2">
                      Unlimited Access
                    </Badge>
                  ) : (
                    <Badge variant="info" className="py-1 px-2">
                      {usage.uniGuideProUsage || 0}/{limits.uniGuideProUsage} Uses
                    </Badge>
                  )}                  <small className="text-muted ml-2">
                    {planType === 'free' ? 'Free Plan' : planType === 'premium' ? 'Premium Plan' : 'Pro Plan'}
                  </small>
                </div>
              )}
            </div>
            {pathway && (
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  console.log('🔄 Generate New Roadmap clicked');
                  
                  // Check if the user can use UniGuidePro based on their subscription plan
                  if (!canPerformAction('useUniGuidePro')) {
                    console.log('⚠️ Generate New Roadmap: Usage limit reached');
                    setAlert({
                      show: true,
                      message: 'You have reached your usage limit for UniGuidePro. Upgrade to Premium or Pro for more access.',
                      variant: 'warning'
                    });
                    showUpgradePrompt('useUniGuidePro', () => setShowUpgradeModal(true));
                    return;
                  }
                  
                  console.log('✅ Generate New Roadmap: Showing form');
                  setShowForm(true);
                }}
                className="d-flex align-items-center"
              >
                Generate New Roadmap
              </Button>
            )}
          </div>
        </div>
      </motion.div>
      {alert.show && (
        <Alert 
          variant={alert.variant} 
          onClose={() => setAlert({ ...alert, show: false })} 
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      
      {!loading && !subscriptionLoading && planType === 'free' && (
        <Alert variant="info" className="mb-4">
          <h5><FaInfoCircle className="mr-2" /> UniGuidePro Usage Limit</h5>
          <p>As a free user, you can use UniGuidePro <strong>5 times per month</strong>. Upgrade to Premium for 10 uses per month or Pro for unlimited access.</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => setShowUpgradeModal(true)}
            >
              View Subscription Options
            </Button>
          </div>
        </Alert>
      )}

      {showForm && (
        <Card className="mb-4">
          <Card.Header>
            <h4>
              <FaGraduationCap className="mr-2" />
              Generate Your Personalized Roadmap
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
