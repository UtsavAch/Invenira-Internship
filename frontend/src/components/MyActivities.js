import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Navbar,
  Button,
  Form,
  ListGroup,
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
import ActivityFormModal from "./ActivityFormModal";
import { UserContext } from "../contexts/user.context";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyActivities = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [formData, setFormData] = useState({
    name: "",
    properties: {},
    config_url: "",
    json_params: "",
    user_url: "",
    analytics: "",
  });

  useEffect(() => {
    // const fetchActivities = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch(`${API_BASE_URL}/activities?all=true`);
    //     const data = await response.json();
    //     setActivities(data);
    //     setLoading(false);
    //   } catch (err) {
    //     setError("Failed to fetch activities");
    //     setLoading(false);
    //   }
    // };

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const url = user
          ? `${API_BASE_URL}/activities?user_id=${user.id}`
          : `${API_BASE_URL}/activities?all=true`;
        const response = await fetch(url);
        const data = await response.json();
        setActivities(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch activities");
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (formData) => {
    try {
      const url = currentActivity
        ? `${API_BASE_URL}/activities/${currentActivity.id}`
        : `${API_BASE_URL}/activities`;

      const method = currentActivity ? "PUT" : "POST";

      const body = { ...formData, user_id: user?.id };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body), // Use passed formData
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

  // const handleDelete = async (id) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
  //       method: "DELETE",
  //     });

  //     if (!response.ok) throw new Error("Delete failed");

  //     setActivities(activities.filter((activity) => activity.id !== id));
  //   } catch (err) {
  //     setError(err.message);
  //   }
  // };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user?.id }), // Include user ID
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

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
    setError(null);
  };

  const handleStartActivity = (id) => {
    navigate(`/start-activity/${id}`);
  };

  return (
    <Container className="mt-4">
      <Navbar bg="light" className="mb-4 p-3 rounded">
        <Navbar.Brand>Activities</Navbar.Brand>
        <Button variant="primary" onClick={handleCreate} className="ms-auto">
          <FontAwesomeIcon
            icon={faPlus}
            className="me-2"
            style={{ marginRight: "10px" }}
          />
          Create Activity
        </Button>
      </Navbar>

      <Form.Group className="mb-4">
        <div
          className="d-flex align-items-center"
          style={{ width: "500px", gap: "30px" }}
        >
          <Form.Control
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "calc(100% - 30px)" }} /* Makes room for icon */
            className="me-2" /* Adds right margin */
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="text-muted"
            style={{ fontSize: "1.5rem" }}
          />
        </div>
      </Form.Group>

      {error && (
        <Alert
          variant="danger"
          className="mb-3"
          onClose={() => setError(null)}
          dismissible
        >
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
                <div style={{ maxWidth: "70%" }}>
                  <h5>{activity.name}</h5>
                  {activity.config_url && (
                    <small className="text-muted d-block">
                      Config: {activity.config_url}
                    </small>
                  )}
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

      <ActivityFormModal
        show={showModal}
        onHide={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        currentActivity={currentActivity}
      />
    </Container>
  );
};

export default MyActivities;
