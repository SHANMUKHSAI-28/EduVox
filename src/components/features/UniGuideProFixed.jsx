import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import studyAbroadService from '../../services/studyAbroadService';
import SubscriptionPlans from '../subscription/SubscriptionPlans';
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
  FaInfoCircle
} from 'react-icons/fa';

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
      <Container className="mt-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: '50vh' }}
        >
          <div className="position-relative mb-4">
            <Spinner 
              animation="border" 
              role="status" 
              className="text-primary"
              style={{ width: '4rem', height: '4rem' }}
            />
            <div className="position-absolute top-50 start-50 translate-middle">
              <FaGlobeAmericas className="text-primary" style={{ fontSize: '1.5rem' }} />
            </div>
          </div>
          <h3 className="text-primary mb-2">Generating Your Study Abroad Roadmap</h3>
          <p className="text-muted">Our AI is crafting a personalized pathway just for you...</p>
          <div className="progress w-50 mt-3" style={{ height: '6px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
              style={{ width: '75%' }}
            ></div>
          </div>
        </motion.div>
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
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
      >
        <div className="p-5 md:p-8 text-white position-relative">
          {/* Decorative elements */}
          <div className="position-absolute top-0 end-0 opacity-10" style={{ width: '16rem', height: '16rem' }}>
            <div className="position-absolute rounded-circle bg-white top-0 end-0" style={{ width: '10rem', height: '10rem' }}></div>
            <div className="position-absolute rounded-circle bg-light" style={{ width: '5rem', height: '5rem', top: '2.5rem', right: '8rem' }}></div>
          </div>
          
          <div className="d-flex align-items-center justify-content-between position-relative" style={{ zIndex: 10 }}>
            <div>
              <div className="d-flex align-items-center">
                <div className="me-4 p-2 bg-white bg-opacity-20 rounded-circle">
                  <FaGlobeAmericas className="text-white" style={{ fontSize: '2rem' }} />
                </div>
                <div>
                  <h1 className="display-4 fw-bold mb-0">UniGuidePro</h1>
                  {!loading && !subscriptionLoading && planType === 'free' && (
                    <Badge 
                      bg="warning" 
                      className="ms-2 px-2 py-1 rounded" 
                      style={{ fontSize: '0.6em' }}
                    >
                      Trial Version
                    </Badge>
                  )}
                  <p className="text-light mt-2 mb-0 fs-5 fw-light">Your AI-powered study abroad journey planner</p>
                </div>
              </div>
              {!loading && !subscriptionLoading && limits && (
                <div className="mt-3">
                  {limits.uniGuideProUsage === -1 ? (
                    <Badge bg="success" className="py-2 px-3 me-2">
                      <FaCheckCircle className="me-1" />
                      Unlimited Access
                    </Badge>
                  ) : (
                    <Badge bg="info" className="py-2 px-3 me-2">
                      {usage.uniGuideProUsage || 0}/{limits.uniGuideProUsage} Uses
                    </Badge>
                  )}
                  <small className="text-light opacity-75">
                    {planType === 'free' ? 'Free Plan' : planType === 'premium' ? 'Premium Plan' : 'Pro Plan'}
                  </small>
                </div>
              )}
            </div>
            {pathway && (
              <Button 
                variant="outline-light" 
                size="lg"
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
                <FaGraduationCap className="me-2" />
                Generate New Roadmap
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {alert.show && (
        <Alert 
          variant={alert.variant} 
          onClose={() => setAlert({ ...alert, show: false })} 
          dismissible
          className="mb-4"
        >
          {alert.message}
        </Alert>
      )}
      
      {/* Usage Info for Free Users */}
      {!loading && !subscriptionLoading && planType === 'free' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Alert variant="info" className="mb-4 border-0 shadow-sm">
            <div className="d-flex align-items-center">
              <FaInfoCircle className="me-3 text-info" style={{ fontSize: '1.5rem' }} />
              <div className="flex-grow-1">
                <h5 className="mb-1">UniGuidePro Usage Limit</h5>
                <p className="mb-2">As a free user, you can use UniGuidePro <strong>5 times per month</strong>. Upgrade to Premium for 10 uses per month or Pro for unlimited access.</p>
              </div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowUpgradeModal(true)}
              >
                View Plans
              </Button>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Form Section */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-4 border-0 shadow-lg">
            <Card.Header className="bg-gradient text-white" style={{ background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)' }}>
              <h4 className="mb-0 d-flex align-items-center">
                <FaGraduationCap className="me-2" />
                Generate Your Personalized Roadmap
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Preferred Country</Form.Label>
                      <Form.Select
                        name="preferredCountry"
                        value={formData.preferredCountry}
                        onChange={handleInputChange}
                        required
                        className="form-select-lg"
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
                      <Form.Label className="fw-semibold">Desired Course/Field</Form.Label>
                      <Form.Control
                        type="text"
                        name="desiredCourse"
                        value={formData.desiredCourse}
                        onChange={handleInputChange}
                        placeholder="e.g., Computer Science, Business Administration"
                        required
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Academic Level</Form.Label>
                      <Form.Select
                        name="academicLevel"
                        value={formData.academicLevel}
                        onChange={handleInputChange}
                        required
                        className="form-select-lg"
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
                      <Form.Label className="fw-semibold">Budget (USD per year)</Form.Label>
                      <Form.Control
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        placeholder="e.g., 50000"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Current GPA</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="currentGPA"
                        value={formData.currentGPA}
                        onChange={handleInputChange}
                        placeholder="e.g., 3.5"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">English Proficiency Level</Form.Label>
                      <Form.Select
                        name="englishProficiency"
                        value={formData.englishProficiency}
                        onChange={handleInputChange}
                        className="form-select-lg"
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
                      <Form.Label className="fw-semibold">Work Experience (years)</Form.Label>
                      <Form.Control
                        type="number"
                        name="workExperience"
                        value={formData.workExperience}
                        onChange={handleInputChange}
                        placeholder="e.g., 2"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Target Company (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="targetCompany"
                        value={formData.targetCompany}
                        onChange={handleInputChange}
                        placeholder="e.g., Google, Microsoft"
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-center mt-4">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    disabled={loading || subscriptionLoading || (!subscriptionLoading && !canPerformAction('useUniGuidePro'))}
                    className="px-5 py-3 shadow"
                    style={{ 
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '0.5rem'
                    }}
                  >
                    {subscriptionLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaGlobeAmericas className="me-2" />
                        Generate My Roadmap
                      </>
                    )}
                  </Button>
                  
                  {!subscriptionLoading && limits && limits.uniGuideProUsage !== -1 && (
                    <div className="mt-3">
                      <small className="text-muted">
                        {Math.max(0, limits.uniGuideProUsage - (usage?.uniGuideProUsage || 0))} uses remaining
                        {planType === 'free' && (
                          <span> - <a href="#" onClick={(e) => {
                            e.preventDefault();
                            setShowUpgradeModal(true);
                          }} className="text-decoration-none">Upgrade for more</a></span>
                        )}
                      </small>
                    </div>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Pathway Results */}
      {pathway && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Usage Information for Limited Plans */}
          {!subscriptionLoading && limits && limits.uniGuideProUsage !== -1 && (
            <Card className="mb-4 border-info">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaInfoCircle className="me-2" />
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

          {/* Progress Overview */}
          <Card className="mb-4 border-0 shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0 d-flex align-items-center">
                <FaMapMarkedAlt className="me-2" />
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
                    style={{ height: '1rem' }}
                  />
                  <p><strong>Course:</strong> {pathway.course}</p>
                  <p><strong>Academic Level:</strong> {pathway.academicLevel}</p>
                  <p><strong>Estimated Timeline:</strong> {
                    pathway.data?.timeline?.totalDuration || 
                    pathway.timeline?.totalDuration || 
                    'Not specified'
                  }</p>
                </Col>
                <Col md={4}>
                  <h6>Quick Stats</h6>
                  <p><strong>Total Steps:</strong> {(pathway.data?.steps || pathway.steps || []).length}</p>
                  <p><strong>Completed:</strong> {(pathway.data?.steps || pathway.steps || []).filter(s => s.status === 'completed').length}</p>
                  <p><strong>In Progress:</strong> {(pathway.data?.steps || pathway.steps || []).filter(s => s.status === 'in-progress').length}</p>
                  <p><strong>Pending:</strong> {(pathway.data?.steps || pathway.steps || []).filter(s => s.status === 'pending').length}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Premium Feature CTA */}
          <Card className="mb-4 border-warning border-2">
            <Card.Header className="text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h5 className="mb-0 d-flex align-items-center">
                <FaCrown className="me-2" />
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
                <Col md={4} className="text-center">
                  <Button
                    size="lg"
                    className="px-4 py-3 shadow"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '0.5rem'
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
                    <FaCrown className="me-2" />
                    Select for Detailed Analysis
                  </Button>
                  <div className="mt-2">
                    <Badge bg="warning" className="px-3 py-1">
                      Premium Feature
                    </Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      <StepModal />
      
      {/* Subscription Plans Modal */}
      {showUpgradeModal && (
        <SubscriptionPlans onClose={() => setShowUpgradeModal(false)} />
      )}
    </Container>
  );
};

export default UniGuidePro;
