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
  Modal,
  Accordion
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
  FaCalendarAlt,
  FaFlag
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
  const [showStepModal, setShowStepModal] = useState(false);
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
      const updatedSteps = pathway.steps.map(step => 
        step.step === stepNumber ? { ...step, status } : step
      );
      
      const updatedPathway = { ...pathway, steps: updatedSteps };
      setPathway(updatedPathway);
      
      await studyAbroadService.saveUserPathway(currentUser.uid, updatedPathway);
      
      setAlert({
        type: 'success',
        message: `Step ${stepNumber} status updated to ${status}`
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
            <h4>Tell us about your study abroad goals</h4>
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
                            setShowStepModal(true);
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
      <Modal show={showStepModal} onHide={() => setShowStepModal(false)} size="lg">
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
