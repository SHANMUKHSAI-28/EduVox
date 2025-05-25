import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import studyAbroadService from '../../services/studyAbroadService';
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
import { 
  FaGlobeAmericas, 
  FaGraduationCap, 
  FaMapMarkedAlt, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle 
} from 'react-icons/fa';

const EdVisor = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pathway, setPathway] = useState(null);
  const [userPathways, setUserPathways] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'info' });

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
    setLoading(true);

    try {
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
        message: 'Your personalized study abroad roadmap has been generated!',
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
      
      // Update local state
      const updatedSteps = pathway.steps.map(step => {
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

      setPathway({
        ...pathway,
        steps: updatedSteps
      });

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
    if (!pathway || !pathway.steps) return 0;
    const completedSteps = pathway.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / pathway.steps.length) * 100;
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
        <Spinner animation="border" role="status">
          <span className="sr-only">Generating your personalized roadmap...</span>
        </Spinner>
        <p className="mt-3">Generating your personalized study abroad roadmap...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <FaGlobeAmericas className="mr-2" />
          EdVisor - Study Abroad Roadmap
        </h1>
        {pathway && (
          <Button variant="outline-primary" onClick={() => setShowForm(true)}>
            Generate New Roadmap
          </Button>
        )}
      </div>

      {alert.show && (
        <Alert 
          variant={alert.variant} 
          onClose={() => setAlert({ ...alert, show: false })} 
          dismissible
        >
          {alert.message}
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
              </Row>

              <div className="text-center">
                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  {loading ? 'Generating...' : 'Generate My Roadmap'}
                </Button>
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
                    className="mb-3"
                  />
                  <p><strong>Course:</strong> {pathway.course}</p>
                  <p><strong>Academic Level:</strong> {pathway.academicLevel}</p>
                  <p><strong>Estimated Timeline:</strong> {pathway.timeline.totalDuration}</p>
                </Col>
                <Col md={4}>
                  <h6>Quick Stats</h6>
                  <p><strong>Total Steps:</strong> {pathway.steps.length}</p>
                  <p><strong>Completed:</strong> {pathway.steps.filter(s => s.status === 'completed').length}</p>
                  <p><strong>In Progress:</strong> {pathway.steps.filter(s => s.status === 'in-progress').length}</p>
                  <p><strong>Pending:</strong> {pathway.steps.filter(s => s.status === 'pending').length}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Roadmap Steps */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Step-by-Step Roadmap</h5>
            </Card.Header>
            <Card.Body>
              <Accordion defaultActiveKey="0">
                {pathway.steps.map((step, index) => (
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
                        {step.tasks.map((task, taskIndex) => (
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
                      </div>
                    </Accordion.Body>
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
                </Card.Header>
                <Card.Body>
                  <p><strong>Tuition:</strong> {pathway.costs.tuition.currency} {pathway.costs.tuition.min.toLocaleString()} - {pathway.costs.tuition.max.toLocaleString()}</p>
                  <p><strong>Living Expenses:</strong> {pathway.costs.living.currency} {pathway.costs.living.min.toLocaleString()} - {pathway.costs.living.max.toLocaleString()}</p>
                  <p><strong>Total Estimated:</strong> {pathway.costs.total.currency} {pathway.costs.total.min.toLocaleString()} - {pathway.costs.total.max.toLocaleString()}</p>
                  
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
                </Card.Header>
                <Card.Body>
                  <p><strong>Visa Type:</strong> {pathway.visaInfo.type}</p>
                  <p><strong>Processing Time:</strong> {pathway.visaInfo.processingTime}</p>
                  <p><strong>Fee:</strong> {pathway.visaInfo.fee}</p>
                  <p><strong>Work Permissions:</strong> {pathway.visaInfo.workPermissions}</p>
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
                </Card.Header>
                <Card.Body>
                  {pathway.universities.slice(0, 5).map((university, index) => (
                    <div key={index} className="mb-2">
                      <strong>{university.name}</strong>
                      {university.ranking && <Badge variant="primary" className="ml-2">#{university.ranking}</Badge>}
                      <br />
                      <small className="text-muted">
                        {university.location} • {university.tuition}
                      </small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Scholarship Opportunities</h5>
                </Card.Header>
                <Card.Body>
                  {pathway.scholarships.slice(0, 3).map((scholarship, index) => (
                    <div key={index} className="mb-2">
                      <strong>{scholarship.name}</strong>
                      <br />
                      <small className="text-muted">
                        {scholarship.amount} • {scholarship.eligibility}
                      </small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Country Tips */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Country-Specific Tips for {pathway.country}</h5>
            </Card.Header>
            <Card.Body>
              <ul>
                {pathway.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </div>
      )}

      <StepModal />
    </Container>
  );
};

export default EdVisor;
