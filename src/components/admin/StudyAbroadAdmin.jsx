import React, { useState, useEffect } from 'react';
import studyAbroadService from '../../services/studyAbroadService';
import { 
  Container, 
  Card, 
  Table, 
  Button, 
  Form, 
  Row, 
  Col, 
  Alert, 
  Spinner, 
  Badge,
  Modal,
  Tabs,
  Tab,
  InputGroup,
  ProgressBar,
  FormControl,
  ButtonGroup,
  Accordion,
  ListGroup
} from 'react-bootstrap';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaEye, 
  FaGlobeAmericas, 
  FaUsers, 
  FaChartLine,
  FaSearch,
  FaUserEdit,
  FaTasks,
  FaSave,
  FaUndo,
  FaGraduationCap,
  FaPercentage,
  FaSyncAlt,
  FaMapMarkerAlt
} from 'react-icons/fa';

const StudyAbroadAdmin = () => {
  // State management
  const [pathwayTemplates, setPathwayTemplates] = useState([]);
  const [userPathways, setUserPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showStepEditModal, setShowStepEditModal] = useState(false);
  
  // Selected items
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedUserPathway, setSelectedUserPathway] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingStep, setEditingStep] = useState({ pathwayId: null, stepIndex: null, step: null });
  
  // Form data
  const [newTemplateData, setNewTemplateData] = useState({
    country: '',
    course: '',
    academicLevel: 'Bachelor',
    steps: []
  });
  const [editTemplateData, setEditTemplateData] = useState({});
  const [stepEditData, setStepEditData] = useState({
    status: 'pending',
    adminNotes: ''
  });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  
  // Alerts and stats
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'info' });
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalUserPathways: 0,
    activeUsers: 0,
    popularCountries: [],
    popularCourses: [],
    averageCompletion: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, userPathwaysData] = await Promise.all([
        studyAbroadService.getAllPathways(),
        studyAbroadService.getAllUserPathways?.() || []
      ]);
      
      setPathwayTemplates(templatesData);
      setUserPathways(userPathwaysData);
      calculateStats(templatesData, userPathwaysData);
    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('Failed to load data. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (templatesData, userPathwaysData) => {
    const totalTemplates = templatesData.length;
    const totalUserPathways = userPathwaysData.length;
    const activeUsers = new Set(userPathwaysData.map(up => up.userId)).size;
    
    // Calculate completion statistics
    let totalCompletionSum = 0;
    let totalPathwaysWithSteps = 0;
    
    userPathwaysData.forEach(pathway => {
      const completedSteps = pathway.steps?.filter(s => s.status === 'completed').length || 0;
      const totalSteps = pathway.steps?.length || 1;
      const completionRate = Math.round((completedSteps / totalSteps) * 100);
      
      if (totalSteps > 0) {
        totalCompletionSum += completionRate;
        totalPathwaysWithSteps++;
      }
    });
    
    const averageCompletion = totalPathwaysWithSteps > 0 ? Math.round(totalCompletionSum / totalPathwaysWithSteps) : 0;
    
    // Calculate popular countries
    const countryCount = {};
    templatesData.forEach(template => {
      countryCount[template.country] = (countryCount[template.country] || 0) + 1;
    });
    
    const popularCountries = Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Calculate popular courses
    const courseCount = {};
    templatesData.forEach(template => {
      courseCount[template.course] = (courseCount[template.course] || 0) + 1;
    });
    
    const popularCourses = Object.entries(courseCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([course, count]) => ({ course, count }));

    setStats({
      totalTemplates,
      totalUserPathways,
      activeUsers,
      averageCompletion,
      popularCountries,
      popularCourses
    });
  };

  const showAlert = (message, variant = 'info') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ ...alert, show: false }), 5000);
  };

  // Filter functions
  const getUniqueCountries = () => {
    const countries = [...new Set(pathwayTemplates.map(t => t.country))];
    return countries.sort();
  };

  const getUniqueLevels = () => {
    const levels = [...new Set(pathwayTemplates.map(t => t.academicLevel))];
    return levels.sort();
  };

  const filteredTemplates = pathwayTemplates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.course?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !filterCountry || template.country === filterCountry;
    const matchesLevel = !filterLevel || template.academicLevel === filterLevel;
    
    return matchesSearch && matchesCountry && matchesLevel;
  });

  const filteredUserPathways = userPathways.filter(pathway => {
    const matchesSearch = !searchTerm || 
      pathway.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pathway.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pathway.course?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !filterCountry || pathway.country === filterCountry;
    
    return matchesSearch && matchesCountry;
  });

  // Template management functions
  const handleCreateTemplate = async (templateData) => {
    try {
      await studyAbroadService.createPathwayTemplate?.(templateData);
      showAlert('Template created successfully!', 'success');
      setShowCreateTemplateModal(false);
      setNewTemplateData({ country: '', course: '', academicLevel: 'Bachelor', steps: [] });
      loadData();
    } catch (error) {
      console.error('Error creating template:', error);
      showAlert('Failed to create template. Please try again.', 'danger');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setEditTemplateData({
      country: template.country,
      course: template.course,
      academicLevel: template.academicLevel
    });
    setShowEditTemplateModal(true);
  };

  const handleUpdateTemplate = async () => {
    try {
      await studyAbroadService.updatePathwayTemplate?.(editingTemplate.id, editTemplateData);
      showAlert('Template updated successfully!', 'success');
      setShowEditTemplateModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating template:', error);
      showAlert('Failed to update template. Please try again.', 'danger');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await studyAbroadService.deletePathwayTemplate?.(templateId);
        showAlert('Template deleted successfully!', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting template:', error);
        showAlert('Failed to delete template. Please try again.', 'danger');
      }
    }
  };

  // User pathway management functions
  const handleViewUserPathway = (pathway) => {
    setSelectedUserPathway(pathway);
    setShowUserModal(true);
  };

  const handleUpdateStepStatus = async () => {
    try {
      await studyAbroadService.updateUserPathwayStepByAdmin?.(
        editingStep.pathwayId,
        editingStep.stepIndex,
        stepEditData
      );
      showAlert('Step status updated successfully!', 'success');
      setShowStepEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating step status:', error);
      showAlert('Failed to update step status. Please try again.', 'danger');
    }
  };

  // Utility functions
  const calculateCompletionPercentage = (pathway) => {
    if (!pathway.steps || pathway.steps.length === 0) return 0;
    const completedSteps = pathway.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / pathway.steps.length) * 100);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCountry('');
    setFilterLevel('');
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading study abroad data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaGlobeAmericas className="mr-2" />
          Study Abroad Administration
        </h2>        <Button variant="primary" onClick={loadData}>
          <FaSyncAlt className="mr-1" />
          Refresh Data
        </Button>
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

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title={
          <span><FaChartLine className="mr-1" />Overview</span>
        }>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center border-primary">
                <Card.Body>
                  <FaGlobeAmericas size={30} className="text-primary mb-2" />
                  <h4 className="text-primary">{stats.totalTemplates}</h4>
                  <p className="mb-0">Pathway Templates</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-success">
                <Card.Body>
                  <FaUsers size={30} className="text-success mb-2" />
                  <h4 className="text-success">{stats.totalUserPathways}</h4>
                  <p className="mb-0">User Pathways</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-warning">
                <Card.Body>
                  <FaUserEdit size={30} className="text-warning mb-2" />
                  <h4 className="text-warning">{stats.activeUsers}</h4>
                  <p className="mb-0">Active Users</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-info">
                <Card.Body>
                  <FaPercentage size={30} className="text-info mb-2" />
                  <h4 className="text-info">{stats.averageCompletion}%</h4>
                  <p className="mb-0">Avg Completion</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5><FaMapMarkerAlt className="mr-2" />Popular Destinations</h5>
                </Card.Header>
                <Card.Body>
                  {stats.popularCountries.map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                      <span className="font-weight-bold">{item.country}</span>
                      <Badge variant="primary">{item.count} templates</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5><FaGraduationCap className="mr-2" />Popular Courses</h5>
                </Card.Header>
                <Card.Body>
                  {stats.popularCourses.map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                      <span className="font-weight-bold">{item.course}</span>
                      <Badge variant="success">{item.count} templates</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="templates" title={
          <span><FaTasks className="mr-1" />Templates</span>
        }>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Pathway Templates</h5>
              <Button 
                variant="success" 
                size="sm"
                onClick={() => setShowCreateTemplateModal(true)}
              >
                <FaPlus className="mr-1" />
                Create Template
              </Button>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Control
                    as="select"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  >
                    <option value="">All Countries</option>
                    {getUniqueCountries().map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </Form.Control>
                </Col>
                <Col md={3}>
                  <Form.Control
                    as="select"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                  >
                    <option value="">All Levels</option>
                    {getUniqueLevels().map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </Form.Control>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={clearFilters}
                  >
                    <FaUndo /> Clear
                  </Button>
                </Col>
              </Row>

              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Course</th>
                    <th>Academic Level</th>
                    <th>Steps</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td>
                        <Badge variant="primary">{template.country}</Badge>
                      </td>
                      <td>{template.course}</td>
                      <td>
                        <Badge variant="secondary">{template.academicLevel}</Badge>
                      </td>
                      <td>
                        <Badge variant="info">{template.steps?.length || 0}</Badge>
                      </td>
                      <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button
                            variant="outline-info"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTemplateModal(true);
                            }}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-warning"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <FaTrash />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="users" title={
          <span><FaUsers className="mr-1" />User Progress</span>
        }>
          <Card>
            <Card.Header>
              <h5 className="mb-0">User Pathway Management</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl
                      placeholder="Search by user ID, country, or course..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Control
                    as="select"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  >
                    <option value="">All Countries</option>
                    {getUniqueCountries().map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </Form.Control>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={clearFilters}
                  >
                    <FaUndo /> Clear
                  </Button>
                </Col>
              </Row>

              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Country</th>
                    <th>Course</th>
                    <th>Level</th>
                    <th>Progress</th>
                    <th>Completion</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserPathways.map((pathway, index) => (
                    <tr key={index}>
                      <td>{pathway.userId?.substring(0, 8)}...</td>
                      <td>{pathway.country}</td>
                      <td>{pathway.course}</td>
                      <td>
                        <Badge variant="secondary">{pathway.academicLevel}</Badge>
                      </td>
                      <td>
                        <ProgressBar 
                          now={calculateCompletionPercentage(pathway)} 
                          label={`${calculateCompletionPercentage(pathway)}%`}
                          size="sm"
                        />
                      </td>
                      <td>
                        {pathway.steps ? 
                          `${pathway.steps.filter(s => s.status === 'completed').length}/${pathway.steps.length}` :
                          'N/A'
                        }
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewUserPathway(pathway)}
                        >
                          <FaEye />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Template Details Modal */}
      <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Template Details: {selectedTemplate?.country} - {selectedTemplate?.course}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTemplate && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Basic Information</h6>
                  <p><strong>Country:</strong> {selectedTemplate.country}</p>
                  <p><strong>Course:</strong> {selectedTemplate.course}</p>
                  <p><strong>Academic Level:</strong> {selectedTemplate.academicLevel}</p>
                  <p><strong>Created:</strong> {new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
                </Col>
                <Col md={6}>
                  <h6>Timeline</h6>
                  <p><strong>Steps:</strong> {selectedTemplate.steps?.length || 0}</p>
                </Col>
              </Row>

              <h6>Pathway Steps</h6>
              <Accordion>
                {selectedTemplate.steps?.map((step, index) => (
                  <Card key={index}>
                    <Accordion.Toggle as={Card.Header} eventKey={index.toString()}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span><strong>Step {step.step}:</strong> {step.title}</span>
                        <Badge variant="secondary">{step.duration}</Badge>
                      </div>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey={index.toString()}>
                      <Card.Body>
                        <p><strong>Description:</strong> {step.description}</p>
                        <p><strong>Tasks:</strong></p>
                        <ListGroup variant="flush">
                          {step.tasks?.map((task, taskIndex) => (
                            <ListGroup.Item key={taskIndex}>{task}</ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Card.Body>
                    </Accordion.Collapse>
                  </Card>
                ))}
              </Accordion>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Pathway Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            User Pathway: {selectedUserPathway?.country} - {selectedUserPathway?.course}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUserPathway && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>User Information</h6>
                  <p><strong>User ID:</strong> {selectedUserPathway.userId}</p>
                  <p><strong>Country:</strong> {selectedUserPathway.country}</p>
                  <p><strong>Course:</strong> {selectedUserPathway.course}</p>
                  <p><strong>Academic Level:</strong> {selectedUserPathway.academicLevel}</p>
                </Col>
                <Col md={6}>
                  <h6>Progress Summary</h6>
                  <p><strong>Total Steps:</strong> {selectedUserPathway.steps?.length || 0}</p>
                  <p><strong>Completed:</strong> {selectedUserPathway.steps?.filter(s => s.status === 'completed').length || 0}</p>
                  <p><strong>In Progress:</strong> {selectedUserPathway.steps?.filter(s => s.status === 'in-progress').length || 0}</p>
                  <p><strong>Pending:</strong> {selectedUserPathway.steps?.filter(s => s.status === 'pending').length || 0}</p>
                  <ProgressBar 
                    now={calculateCompletionPercentage(selectedUserPathway)} 
                    label={`${calculateCompletionPercentage(selectedUserPathway)}%`}
                    className="mt-2"
                  />
                </Col>
              </Row>

              <h6>Step Management</h6>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Admin Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserPathway.steps?.map((step, index) => (
                    <tr key={index}>
                      <td>{step.step}</td>
                      <td>{step.title}</td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(step.status)}>
                          {step.status}
                        </Badge>
                      </td>
                      <td>{step.duration}</td>
                      <td>{step.adminNotes || 'No notes'}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => {
                            setEditingStep({
                              pathwayId: selectedUserPathway.id,
                              stepIndex: index,
                              step: step
                            });
                            setStepEditData({
                              status: step.status,
                              adminNotes: step.adminNotes || ''
                            });
                            setShowStepEditModal(true);
                          }}
                        >
                          <FaEdit />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Step Edit Modal */}
      <Modal show={showStepEditModal} onHide={() => setShowStepEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit Step: {editingStep.step?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Control
                as="select"
                value={stepEditData.status}
                onChange={(e) => setStepEditData({...stepEditData, status: e.target.value})}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Admin Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={stepEditData.adminNotes}
                onChange={(e) => setStepEditData({...stepEditData, adminNotes: e.target.value})}
                placeholder="Add notes about this step..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStepEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStepStatus}>
            <FaSave className="mr-1" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Template Modal */}
      <Modal show={showCreateTemplateModal} onHide={() => setShowCreateTemplateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Pathway Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTemplateData.country}
                    onChange={(e) => setNewTemplateData({...newTemplateData, country: e.target.value})}
                    placeholder="e.g., United States"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Course</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTemplateData.course}
                    onChange={(e) => setNewTemplateData({...newTemplateData, course: e.target.value})}
                    placeholder="e.g., Computer Science"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Academic Level</Form.Label>
              <Form.Control
                as="select"
                value={newTemplateData.academicLevel}
                onChange={(e) => setNewTemplateData({...newTemplateData, academicLevel: e.target.value})}
              >
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateTemplateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleCreateTemplate(newTemplateData)}
            disabled={!newTemplateData.country || !newTemplateData.course}
          >
            <FaPlus className="mr-1" />
            Create Template
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Template Modal */}
      <Modal show={showEditTemplateModal} onHide={() => setShowEditTemplateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Edit Template: {editingTemplate?.country} - {editingTemplate?.course}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    value={editTemplateData.country || ''}
                    onChange={(e) => setEditTemplateData({...editTemplateData, country: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Course</Form.Label>
                  <Form.Control
                    type="text"
                    value={editTemplateData.course || ''}
                    onChange={(e) => setEditTemplateData({...editTemplateData, course: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Academic Level</Form.Label>
              <Form.Control
                as="select"
                value={editTemplateData.academicLevel || ''}
                onChange={(e) => setEditTemplateData({...editTemplateData, academicLevel: e.target.value})}
              >
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditTemplateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateTemplate}>
            <FaSave className="mr-1" />
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudyAbroadAdmin;
