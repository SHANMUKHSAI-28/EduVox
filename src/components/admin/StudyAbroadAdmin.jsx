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
  Tab
} from 'react-bootstrap';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaEye, 
  FaGlobeAmericas, 
  FaUsers, 
  FaChartLine 
} from 'react-icons/fa';

const StudyAbroadAdmin = () => {
  const [pathways, setPathways] = useState([]);
  const [userPathways, setUserPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState(null);
  const [editingPathway, setEditingPathway] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'info' });
  const [stats, setStats] = useState({
    totalPathways: 0,
    totalUsers: 0,
    popularCountries: [],
    popularCourses: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pathwaysData, userPathwaysData] = await Promise.all([
        studyAbroadService.getAllPathways(),
        // Note: You might need to add a method to get all user pathways for admin
        studyAbroadService.getAllUserPathways?.() || []
      ]);
      
      setPathways(pathwaysData);
      setUserPathways(userPathwaysData);
      calculateStats(pathwaysData, userPathwaysData);
    } catch (error) {
      console.error('Error loading data:', error);
      setAlert({
        show: true,
        message: 'Failed to load data. Please try again.',
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pathwaysData, userPathwaysData) => {
    const totalPathways = pathwaysData.length;
    const totalUsers = new Set(userPathwaysData.map(up => up.userId)).size;
    
    // Calculate popular countries
    const countryCount = {};
    pathwaysData.forEach(pathway => {
      countryCount[pathway.country] = (countryCount[pathway.country] || 0) + 1;
    });
    
    const popularCountries = Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Calculate popular courses
    const courseCount = {};
    pathwaysData.forEach(pathway => {
      courseCount[pathway.course] = (courseCount[pathway.course] || 0) + 1;
    });
    
    const popularCourses = Object.entries(courseCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([course, count]) => ({ course, count }));

    setStats({
      totalPathways,
      totalUsers,
      popularCountries,
      popularCourses
    });
  };

  const handleDeletePathway = async (pathwayId) => {
    if (window.confirm('Are you sure you want to delete this pathway?')) {
      try {
        await studyAbroadService.deletePathway(pathwayId);
        setAlert({
          show: true,
          message: 'Pathway deleted successfully!',
          variant: 'success'
        });
        loadData();
      } catch (error) {
        console.error('Error deleting pathway:', error);
        setAlert({
          show: true,
          message: 'Failed to delete pathway.',
          variant: 'danger'
        });
      }
    }
  };

  const handleViewPathway = (pathway) => {
    setSelectedPathway(pathway);
    setShowModal(true);
  };

  const handleEditPathway = (pathway) => {
    setEditingPathway(pathway);
    setEditFormData({
      country: pathway.country || '',
      course: pathway.course || '',
      academicLevel: pathway.academicLevel || '',
      isActive: pathway.isActive || false
    });
    setShowEditModal(true);
  };

  const handleUpdatePathway = async () => {
    try {
      await studyAbroadService.updateUserPathwayByAdmin(editingPathway.id, editFormData);
      setAlert({
        show: true,
        message: 'Pathway updated successfully!',
        variant: 'success'
      });
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating pathway:', error);
      setAlert({
        show: true,
        message: 'Failed to update pathway.',
        variant: 'danger'
      });
    }
  };  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await studyAbroadService.updateUserPathwayByAdmin(editingPathway.id, editFormData);
      setAlert({
        show: true,
        message: 'Pathway updated successfully!',
        variant: 'success'
      });
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating pathway:', error);
      setAlert({
        show: true,
        message: 'Failed to update pathway.',
        variant: 'danger'
      });
    }
  };

  const PathwayModal = () => (
    <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          Pathway Details: {selectedPathway?.country} - {selectedPathway?.course}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedPathway && (
          <div>
            <Row className="mb-4">
              <Col md={6}>
                <h6>Basic Information</h6>
                <p><strong>Country:</strong> {selectedPathway.country}</p>
                <p><strong>Course:</strong> {selectedPathway.course}</p>
                <p><strong>Academic Level:</strong> {selectedPathway.academicLevel}</p>
                <p><strong>Created:</strong> {new Date(selectedPathway.createdAt).toLocaleDateString()}</p>
              </Col>
              <Col md={6}>
                <h6>Timeline</h6>
                <p><strong>Total Duration:</strong> {selectedPathway.timeline?.totalDuration || 'Not specified'}</p>
                <p><strong>Phases:</strong></p>
                <ul>
                  {selectedPathway.timeline.phases.map((phase, index) => (
                    <li key={index}>
                      {phase.phase}: {phase.duration} - {phase.description}
                    </li>
                  ))}
                </ul>
              </Col>
            </Row>

            <h6>Pathway Steps ({selectedPathway.steps.length})</h6>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Title</th>
                  <th>Duration</th>
                  <th>Tasks</th>
                </tr>
              </thead>
              <tbody>
                {selectedPathway.steps.map((step) => (
                  <tr key={step.step}>
                    <td>{step.step}</td>
                    <td>{step.title}</td>
                    <td>{step.duration}</td>
                    <td>{step.tasks.length} tasks</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <Row className="mt-4">
              <Col md={6}>
                <h6>Cost Information</h6>
                <p><strong>Tuition:</strong> {selectedPathway.costs.tuition.currency} {selectedPathway.costs.tuition.min.toLocaleString()} - {selectedPathway.costs.tuition.max.toLocaleString()}</p>
                <p><strong>Living:</strong> {selectedPathway.costs.living.currency} {selectedPathway.costs.living.min.toLocaleString()} - {selectedPathway.costs.living.max.toLocaleString()}</p>
                <p><strong>Total:</strong> {selectedPathway.costs.total.currency} {selectedPathway.costs.total.min.toLocaleString()} - {selectedPathway.costs.total.max.toLocaleString()}</p>
              </Col>
              <Col md={6}>
                <h6>Visa Information</h6>
                <p><strong>Type:</strong> {selectedPathway.visaInfo.type}</p>
                <p><strong>Processing Time:</strong> {selectedPathway.visaInfo.processingTime}</p>
                <p><strong>Fee:</strong> {selectedPathway.visaInfo.fee}</p>
              </Col>
            </Row>

            <h6>Universities ({selectedPathway.universities.length})</h6>
            <Row>
              {selectedPathway.universities.slice(0, 6).map((university, index) => (
                <Col md={4} key={index} className="mb-2">
                  <Card size="sm">
                    <Card.Body className="p-2">
                      <h6 className="mb-1">{university.name}</h6>
                      <small className="text-muted">
                        {university.location}<br />
                        {university.tuition}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const EditPathwayModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Edit Pathway: {editingPathway?.country} - {editingPathway?.course}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editingPathway && (
          <Form onSubmit={handleEditFormSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  name="country"
                  value={editFormData.country}
                  onChange={handleEditFormChange}
                  required
                />
              </Form.Group>

              <Form.Group as={Col} md={6}>
                <Form.Label>Course</Form.Label>
                <Form.Control
                  type="text"
                  name="course"
                  value={editFormData.course}
                  onChange={handleEditFormChange}
                  required
                />
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md={6}>
                <Form.Label>Academic Level</Form.Label>
                <Form.Control
                  type="text"
                  name="academicLevel"
                  value={editFormData.academicLevel}
                  onChange={handleEditFormChange}
                  required
                />
              </Form.Group>

              <Form.Group as={Col} md={6}>
                <Form.Label>Active</Form.Label>
                <Form.Check
                  type="checkbox"
                  name="isActive"
                  checked={editFormData.isActive}
                  onChange={handleEditFormChange}
                />
              </Form.Group>
            </Row>

            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

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
        </h2>
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

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaGlobeAmericas size={30} className="text-primary mb-2" />
              <h4>{stats.totalPathways}</h4>
              <p className="mb-0">Total Pathways</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaUsers size={30} className="text-success mb-2" />
              <h4>{stats.totalUsers}</h4>
              <p className="mb-0">Active Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaChartLine size={30} className="text-warning mb-2" />
              <h4>{stats.popularCountries.length}</h4>
              <p className="mb-0">Countries Covered</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaGlobeAmericas size={30} className="text-info mb-2" />
              <h4>{stats.popularCourses.length}</h4>
              <p className="mb-0">Course Categories</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="pathways" id="admin-tabs" className="mb-3">
        <Tab eventKey="pathways" title="Pathway Templates">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Pathway Templates</h5>
              <Button variant="primary" size="sm">
                <FaPlus className="mr-1" />
                Add New Pathway
              </Button>
            </Card.Header>
            <Card.Body>
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
                  {pathways.map((pathway) => (
                    <tr key={pathway.id}>
                      <td>
                        <Badge variant="primary">{pathway.country}</Badge>
                      </td>
                      <td>{pathway.course}</td>
                      <td>
                        <Badge variant="secondary">{pathway.academicLevel}</Badge>
                      </td>
                      <td>{pathway.steps?.length || 0}</td>
                      <td>{new Date(pathway.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleViewPathway(pathway)}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEditPathway(pathway)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeletePathway(pathway.id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="analytics" title="Analytics">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Popular Destinations</h5>
                </Card.Header>
                <Card.Body>
                  {stats.popularCountries.map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <span>{item.country}</span>
                      <Badge variant="primary">{item.count} pathways</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Popular Courses</h5>
                </Card.Header>
                <Card.Body>
                  {stats.popularCourses.map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <span>{item.course}</span>
                      <Badge variant="success">{item.count} pathways</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="users" title="User Activity">
          <Card>
            <Card.Header>
              <h5>Recent User Pathways</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Country</th>
                    <th>Course</th>
                    <th>Progress</th>
                    <th>Created</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {userPathways.slice(0, 10).map((pathway, index) => (
                    <tr key={index}>
                      <td>{pathway.userId?.substring(0, 8)}...</td>
                      <td>{pathway.country}</td>
                      <td>{pathway.course}</td>
                      <td>
                        {pathway.steps ? 
                          `${pathway.steps.filter(s => s.status === 'completed').length}/${pathway.steps.length}` :
                          'N/A'
                        }
                      </td>
                      <td>{new Date(pathway.createdAt).toLocaleDateString()}</td>
                      <td>{pathway.updatedAt ? new Date(pathway.updatedAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <PathwayModal />
      <EditPathwayModal />
    </Container>
  );
};

export default StudyAbroadAdmin;
