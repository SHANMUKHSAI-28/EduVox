import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscriptionLimits } from '../../../hooks/useSubscriptionLimits';
import studyAbroadService from '../../../services/studyAbroadService';
import SubscriptionStatus from '../../subscription/SubscriptionStatus';
import SubscriptionPlans from '../../subscription/SubscriptionPlans';
import Button from '../../common/Button';
import Alert from '../../common/Alert';
import LoadingSpinner from '../../common/LoadingSpinner';
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
    subscriptionLoading 
  } = useSubscriptionLimits();
  const [loading, setLoading] = useState(false);
  const [pathway, setPathway] = useState(null);
  const [existingPathways, setExistingPathways] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loadingPathways, setLoadingPathways] = useState(false);

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

  // Load existing pathways on component mount
  useEffect(() => {
    const loadExistingPathways = async () => {
      if (!currentUser) return;
      
      try {
        setLoadingPathways(true);
        const pathways = await studyAbroadService.getUserPathways(currentUser.uid);
        setExistingPathways(pathways || []);
        
        // If user has pathways, show them instead of the form initially
        if (pathways && pathways.length > 0) {
          setShowForm(false);
        }
      } catch (error) {
        console.error('Error loading existing pathways:', error);
      } finally {
        setLoadingPathways(false);
      }
    };

    loadExistingPathways();
  }, [currentUser]);

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
      // First, check if user already has a pathway for this criteria
      const existingPathway = await studyAbroadService.checkExistingPathway(
        currentUser.uid, 
        formData.preferredCountry, 
        formData.desiredCourse, 
        formData.academicLevel
      );

      if (existingPathway) {
        setPathway(existingPathway);
        setShowForm(false);
        setAlert({
          type: 'info',
          message: 'Found your existing pathway for this combination! No need to generate a new one.'
        });
        return;
      }

      await trackUsage('useUniGuidePro');

      const userProfile = {
        userId: currentUser.uid,
        ...formData,
        budget: formData.budget ? parseInt(formData.budget) : null,
        currentGPA: formData.currentGPA ? parseFloat(formData.currentGPA) : null
      };

      const generatedPathway = await studyAbroadService.generatePathway(userProfile);
      setPathway(generatedPathway);
      
      // Add to existing pathways list
      setExistingPathways(prev => [generatedPathway, ...prev]);
      
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

  const handleRemovePathway = async (pathwayId) => {
    try {
      const confirmRemoval = window.confirm(
        'Are you sure you want to remove this pathway? You can always generate it again later.'
      );
      
      if (!confirmRemoval) return;

      await studyAbroadService.removeUserPathway(currentUser.uid, pathwayId);
      
      // Remove from existing pathways list
      setExistingPathways(prev => prev.filter(p => p.id !== pathwayId));
      
      // If this was the currently displayed pathway, clear it
      if (pathway && pathway.id === pathwayId) {
        setPathway(null);
        setShowForm(true);
      }
      
      setAlert({
        type: 'success',
        message: 'Pathway removed successfully!'
      });
    } catch (error) {
      console.error('Error removing pathway:', error);
      setAlert({
        type: 'error',
        message: 'Failed to remove pathway. Please try again.'
      });
    }
  };

  const handleSelectPathway = (selectedPathway) => {
    setPathway(selectedPathway);
    setShowForm(false);
  };

  const handleCreateNew = () => {
    setPathway(null);
    setShowForm(true);
    setFormData({
      preferredCountry: '',
      desiredCourse: '',
      academicLevel: '',
      budget: '',
      currentGPA: '',
      englishProficiency: '',
      workExperience: ''
    });
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

      {/* Existing Pathways Section */}
      {!loadingPathways && existingPathways.length > 0 && !pathway && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardTransition}>
          <Card className="mb-4 shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FaListUl className="mr-2" />
                Your Study Abroad Pathways
              </h4>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleCreateNew}
                className="d-flex align-items-center"
              >
                <FaFileAlt className="mr-1" />
                Create New Pathway
              </Button>
            </Card.Header>
            <Card.Body>
              <Row>
                {existingPathways.slice(0, planType === 'free' ? 3 : existingPathways.length).map((existingPathway, index) => (
                  <Col md={6} lg={4} key={existingPathway.id || index} className="mb-3">
                    <Card className="h-100 border">
                      <Card.Body className="d-flex flex-column">
                        <div className="flex-grow-1">
                          <h6 className="text-primary mb-2">
                            <FaFlag className="mr-1" />
                            {existingPathway.country}
                          </h6>
                          <p className="mb-1">
                            <strong>Course:</strong> {existingPathway.course || existingPathway.desiredCourse}
                          </p>
                          <p className="mb-1">
                            <strong>Level:</strong> {existingPathway.academicLevel}
                          </p>
                          <p className="mb-2 text-muted small">
                            <FaCalendarAlt className="mr-1" />
                            Created: {new Date(existingPathway.createdAt).toLocaleDateString()}
                          </p>
                          
                          {/* Progress indicator */}
                          {existingPathway.steps && (
                            <div className="mb-2">
                              <small className="text-muted">Progress:</small>
                              <ProgressBar 
                                now={(() => {
                                  const completed = existingPathway.steps.filter(s => s.status === 'completed').length;
                                  return (completed / existingPathway.steps.length) * 100;
                                })()} 
                                size="sm" 
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="d-flex justify-content-between mt-auto">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleSelectPathway(existingPathway)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleRemovePathway(existingPathway.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              
              {/* Free user limitation message */}
              {planType === 'free' && existingPathways.length > 3 && (
                <div className="bg-light rounded p-3 mt-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">
                        <FaInfoCircle className="mr-2" />
                        Showing 3 of {existingPathways.length} pathways
                      </p>
                      <small className="text-muted">
                        Upgrade to Premium to view all your pathways
                      </small>
                    </div>
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => setShowUpgradeModal(true)}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* Loading existing pathways */}
      {loadingPathways && (
        <Card className="mb-4 shadow">
          <Card.Body className="text-center py-4">
            <LoadingSpinner />
            <p className="mt-2 mb-0 text-muted">Loading your existing pathways...</p>
          </Card.Body>
        </Card>
      )}

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
              <FaFileAlt className="mr-2" />
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
      )}      {pathway && (
        <div>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FaMapMarkedAlt className="mr-2" />
                Your Study Abroad Journey to {pathway.country}
              </h4>
              <div className="d-flex gap-2">
                {existingPathways.length > 1 && (
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setPathway(null)}
                    className="d-flex align-items-center"
                  >
                    <FaListUl className="mr-1" />
                    Back to List
                  </Button>
                )}
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleCreateNew}
                  className="d-flex align-items-center"
                >
                  <FaFileAlt className="mr-1" />
                  Create New
                </Button>
              </div>
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
          </Card>          <Card className="mb-4">
            <Card.Header>
              <h5>Step-by-Step Roadmap</h5>
              {planType === 'free' && (
                <Badge variant="warning" className="ml-2">
                  <FaCrown className="mr-1" />
                  Basic View - Upgrade for Full Details
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {/* Timeline View for Premium Users */}
              {planType !== 'free' && pathway.timeline && (
                <div className="mb-4">
                  <h6><FaCalendarAlt className="mr-2" />Detailed Timeline</h6>
                  <div className="timeline-container">
                    {pathway.timeline.map((timelineStep, index) => (
                      <Card key={index} className="mb-3 border-left-primary">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{timelineStep.month}</h6>
                              <Badge variant={timelineStep.priority === 'Critical' ? 'danger' : timelineStep.priority === 'High' ? 'warning' : 'info'}>
                                {timelineStep.priority} Priority
                              </Badge>
                              <p className="mt-2 mb-2">
                                <strong>Time from start:</strong> {timelineStep.timeFromStart} months
                              </p>
                              <div>
                                <strong>Tasks:</strong>
                                <ul className="mt-2">
                                  {timelineStep.tasks.map((task, taskIndex) => (
                                    <li key={taskIndex}>{task}</li>
                                  ))}
                                </ul>
                              </div>
                              {timelineStep.documents && (
                                <p><strong>Required Documents:</strong> {timelineStep.documents}</p>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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
                      
                      {/* Free users get basic info only */}
                      {planType === 'free' && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <p className="text-muted mb-2">
                            <FaInfoCircle className="mr-2" />
                            This is a basic overview. Upgrade to Premium for:
                          </p>
                          <ul className="text-muted small">
                            <li>Detailed step-by-step instructions</li>
                            <li>Document requirements and costs</li>
                            <li>Timeline and deadlines</li>
                            <li>University recommendations</li>
                            <li>Visa and scholarship information</li>
                          </ul>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            onClick={() => setShowUpgradeModal(true)}
                          >
                            <FaCrown className="mr-1" />
                            Upgrade Now
                          </Button>
                        </div>
                      )}

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
            </Card.Body>          </Card>

          {/* Premium Content - Universities Section */}
          {planType !== 'free' && pathway.universities && (
            <Card className="mb-4">
              <Card.Header>
                <h5><FaGlobeAmericas className="mr-2" />Recommended Universities</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {pathway.universities.map((university, index) => (
                    <Col md={6} key={index} className="mb-3">
                      <Card className="h-100 border-primary">
                        <Card.Body>
                          <h6>{university.name}</h6>
                          <p><strong>Location:</strong> {university.location}</p>
                          <p><strong>Ranking:</strong> #{university.ranking}</p>
                          <p><strong>Tuition Fee:</strong> ${university.tuitionFee}</p>
                          <p><strong>Acceptance Rate:</strong> {university.acceptanceRate}%</p>
                          <p><strong>Deadline:</strong> {university.applicationDeadline}</p>
                          <div>
                            <strong>Requirements:</strong>
                            <ul className="small mt-1">
                              <li>GPA: {university.requirements.gpa}</li>
                              <li>IELTS: {university.requirements.ielts}</li>
                              <li>TOEFL: {university.requirements.toefl}</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Specialties:</strong>
                            <div>
                              {university.specialties.map((specialty, idx) => (
                                <Badge key={idx} variant="info" className="mr-1 mb-1">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Premium Content - Cost Breakdown */}
          {planType !== 'free' && pathway.costs && (
            <Card className="mb-4">
              <Card.Header>
                <h5><FaMoneyBillWave className="mr-2" />Cost Breakdown</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Tuition Costs</h6>
                    <p><strong>Annual:</strong> ${pathway.costs.tuition?.annual}</p>
                    <p><strong>Total Program:</strong> ${pathway.costs.tuition?.total}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Living Expenses (Monthly)</h6>
                    <p><strong>Accommodation:</strong> ${pathway.costs.living?.accommodation}</p>
                    <p><strong>Food:</strong> ${pathway.costs.living?.food}</p>
                    <p><strong>Transportation:</strong> ${pathway.costs.living?.transportation}</p>
                    <p><strong>Total Monthly:</strong> ${pathway.costs.living?.monthly}</p>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <h6>One-time Costs</h6>
                    <p><strong>Visa Fees:</strong> ${pathway.costs.oneTime?.visaFees}</p>
                    <p><strong>Application Fees:</strong> ${pathway.costs.oneTime?.applicationFees}</p>
                    <p><strong>Airfare:</strong> ${pathway.costs.oneTime?.airfare}</p>
                    <p><strong>Initial Setup:</strong> ${pathway.costs.oneTime?.initialSetup}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Additional Costs</h6>
                    <p><strong>Books:</strong> ${pathway.costs.books}</p>
                    <p><strong>Insurance:</strong> ${pathway.costs.insurance}</p>
                  </Col>
                </Row>
                <div className="mt-3 p-3 bg-info rounded text-white">
                  <h6><strong>Total Estimated Cost: ${pathway.costs.totalEstimate}</strong></h6>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Premium Content - Documents Required */}
          {planType !== 'free' && pathway.documents && (
            <Card className="mb-4">
              <Card.Header>
                <h5><FaFileAlt className="mr-2" />Required Documents</h5>
              </Card.Header>
              <Card.Body>
                {pathway.documents.map((doc, index) => (
                  <Card key={index} className="mb-3 border-left-warning">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6>{doc.name}</h6>
                          <p>{doc.description}</p>
                          <Row>
                            <Col md={6}>
                              <p><strong>Processing Time:</strong> {doc.processingTime}</p>
                              <p><strong>Cost:</strong> {doc.cost}</p>
                            </Col>
                            <Col md={6}>
                              <p><strong>Required:</strong> {doc.required ? 'Yes' : 'No'}</p>
                              <p className="small"><strong>Tips:</strong> {doc.tips}</p>
                            </Col>
                          </Row>
                        </div>
                        <Badge variant={doc.required ? 'danger' : 'warning'}>
                          {doc.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Premium Content - Scholarships */}
          {planType !== 'free' && pathway.scholarships && (
            <Card className="mb-4">
              <Card.Header>
                <h5><FaCrown className="mr-2" />Available Scholarships</h5>
              </Card.Header>
              <Card.Body>
                {pathway.scholarships.map((scholarship, index) => (
                  <Card key={index} className="mb-3 border-left-success">
                    <Card.Body>
                      <h6>{scholarship.name}</h6>
                      <Row>
                        <Col md={6}>
                          <p><strong>Amount:</strong> {scholarship.amount}</p>
                          <p><strong>Deadline:</strong> {scholarship.deadline}</p>
                          <p><strong>Renewability:</strong> {scholarship.renewability}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Competitiveness:</strong> {scholarship.competitiveness}</p>
                          <p><strong>Application:</strong> {scholarship.applicationProcess}</p>
                        </Col>
                      </Row>
                      <p><strong>Eligibility:</strong> {scholarship.eligibility}</p>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Premium Content - Visa Requirements */}
          {planType !== 'free' && pathway.visaRequirements && (
            <Card className="mb-4">
              <Card.Header>
                <h5><FaFlag className="mr-2" />Visa Requirements</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Basic Information</h6>
                    <p><strong>Visa Type:</strong> {pathway.visaRequirements.type}</p>
                    <p><strong>Fee:</strong> {pathway.visaRequirements.fee}</p>
                    <p><strong>Processing Time:</strong> {pathway.visaRequirements.processingTime}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Additional Requirements</h6>
                    <p><strong>Financial Proof:</strong> {pathway.visaRequirements.financialProof}</p>
                    <p><strong>Biometrics:</strong> {pathway.visaRequirements.biometrics}</p>
                    <p><strong>Medical:</strong> {pathway.visaRequirements.medicalRequirements}</p>
                  </Col>
                </Row>
                {pathway.visaRequirements.requirements && (
                  <div className="mt-3">
                    <h6>Required Documents:</h6>
                    <ul>
                      {pathway.visaRequirements.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Premium Content - Career Prospects */}
          {planType !== 'free' && pathway.careerProspects && (
            <Card className="mb-4">
              <Card.Header>
                <h5><FaListUl className="mr-2" />Career Prospects</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Salary Expectations</h6>
                    <p><strong>Entry Level:</strong> ${pathway.careerProspects.averageSalary?.entryLevel}</p>
                    <p><strong>Experienced:</strong> ${pathway.careerProspects.averageSalary?.experienced}</p>
                    <p><strong>Top Tier:</strong> ${pathway.careerProspects.averageSalary?.topTier}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Job Market</h6>
                    <p><strong>Demand:</strong> {pathway.careerProspects.jobMarket?.demand}</p>
                    <p><strong>Growth Rate:</strong> {pathway.careerProspects.jobMarket?.growthRate}</p>
                    <p><strong>Outlook:</strong> {pathway.careerProspects.jobMarket?.outlook}</p>
                  </Col>
                </Row>
                {pathway.careerProspects.jobRoles && (
                  <div className="mt-3">
                    <h6>Potential Job Roles:</h6>
                    <div>
                      {pathway.careerProspects.jobRoles.map((role, index) => (
                        <Badge key={index} variant="primary" className="mr-2 mb-2">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pathway.careerProspects.topEmployers && (
                  <div className="mt-3">
                    <h6>Top Employers:</h6>
                    <div>
                      {pathway.careerProspects.topEmployers.map((employer, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {employer}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

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
      <Modal show={showStepModal} onHide={() => setShowStepModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            {selectedStep && getStepIcon(selectedStep.status)}
            <span className="ml-2">
              Step {selectedStep?.step}: {selectedStep?.title}
            </span>
          </Modal.Title>
        </Modal.Header>        <Modal.Body>
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

              {/* Premium Content in Modal */}
              {planType !== 'free' && pathway.timeline && (
                <div className="mb-3">
                  <h6><FaListUl className="mr-2" />Related Timeline Activities:</h6>
                  {pathway.timeline
                    .filter(timelineStep => 
                      timelineStep.tasks.some(task => 
                        task.toLowerCase().includes(selectedStep.title.toLowerCase().split(' ')[0])
                      )
                    )
                    .map((timelineStep, index) => (
                      <Card key={index} className="mb-2 border-left-info">
                        <Card.Body className="py-2">
                          <h6 className="mb-1">{timelineStep.month}</h6>
                          <ul className="mb-0">
                            {timelineStep.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className="small">{task}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    ))}
                </div>
              )}

              {/* Free user upgrade prompt in modal */}
              {planType === 'free' && (
                <div className="mb-3 p-3 bg-warning rounded">
                  <h6><FaCrown className="mr-2" />Unlock Detailed Guidance</h6>
                  <p className="mb-2">Premium users get:</p>
                  <ul className="small mb-2">
                    <li>Detailed timeline with specific months</li>
                    <li>Document checklists and costs</li>
                    <li>University-specific requirements</li>
                    <li>Scholarship opportunities</li>
                  </ul>
                  <Button 
                    variant="warning" 
                    size="sm" 
                    onClick={() => {
                      setShowStepModal(false);
                      setShowUpgradeModal(true);
                    }}
                  >
                    <FaCrown className="mr-1" />
                    Upgrade Now
                  </Button>
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
      
      {/* Subscription Plans Modal */}
      {showUpgradeModal && (
        <SubscriptionPlans onClose={() => setShowUpgradeModal(false)} />
      )}
    </Container>
  );
};

export default UniGuidePro;
