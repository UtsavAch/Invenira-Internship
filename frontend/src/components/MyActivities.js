import React, { useState, useEffect } from "react";
import {
  Container,
  Navbar,
  Button,
  Form,
  ListGroup,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyActivities = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    properties: {},
    config_url: "",
    json_params: "",
    user_url: "",
    analytics: "",
  });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/activities?all=true`);
        const data = await response.json();
        setActivities(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch activities");
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = currentActivity
        ? `${API_BASE_URL}/activities/${currentActivity.id}`
        : `${API_BASE_URL}/activities`;

      const method = currentActivity ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Operation failed");

      const updatedActivity = await response.json();

      if (currentActivity) {
        setActivities(
          activities.map((activity) =>
            activity.id === updatedActivity.id ? updatedActivity : activity
          )
        );
      } else {
        setActivities([...activities, updatedActivity]);
      }

      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      setActivities(activities.filter((activity) => activity.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (activity) => {
    setCurrentActivity(activity);
    setFormData({
      name: activity.name,
      properties: activity.properties || {},
      config_url: activity.config_url || "",
      json_params: activity.json_params || "",
      user_url: activity.user_url || "",
      analytics: activity.analytics || "",
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setCurrentActivity(null);
    setFormData({
      name: "",
      properties: {},
      config_url: "",
      json_params: "",
      user_url: "",
      analytics: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentActivity(null);
  };

  const handleStartActivity = (id) => {
    navigate(`/start-activity/${id}`);
  };

  return (
    <Container className="mt-4">
      <Navbar bg="light" className="mb-4 p-3 rounded">
        <Navbar.Brand>Activities</Navbar.Brand>
        <Button variant="primary" onClick={handleCreate} className="ms-auto">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Activity
        </Button>
      </Navbar>

      <Form.Group className="mb-4">
        <Form.Control
          type="text"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FontAwesomeIcon
          icon={faSearch}
          className="text-muted position-absolute end-0 me-3 mt-2"
        />
      </Form.Group>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <ListGroup>
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <ListGroup.Item
                key={activity.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <h5>{activity.name}</h5>
                  <small className="text-muted">
                    {activity.config_url && `Config: ${activity.config_url}`}
                  </small>
                </div>
                <div>
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleStartActivity(activity.id)}
                  >
                    <FontAwesomeIcon icon={faPlay} />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(activity)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center">
              No activities found
            </ListGroup.Item>
          )}
        </ListGroup>
      )}

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentActivity ? "Edit Activity" : "Create New Activity"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Activity Name</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Config URL</Form.Label>
              <Form.Control
                name="config_url"
                value={formData.config_url}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>JSON Params</Form.Label>
              <Form.Control
                name="json_params"
                value={formData.json_params}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>User URL</Form.Label>
              <Form.Control
                name="user_url"
                value={formData.user_url}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Analytics</Form.Label>
              <Form.Control
                name="analytics"
                value={formData.analytics}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {currentActivity ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MyActivities;
