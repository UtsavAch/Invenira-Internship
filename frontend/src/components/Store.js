import React, { useState, useEffect } from "react";
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
import { faSearch, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Store = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  const handleStartActivity = (id) => {
    navigate(`/start-activity/${id}`);
  };

  return (
    <Container className="mt-4">
      <Navbar bg="light" className="mb-4 p-3 rounded">
        <Navbar.Brand
          style={{
            fontWeight: "bold",
            fontSize: "2rem",
          }}
        >
          Store
        </Navbar.Brand>
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
            style={{ width: "calc(100% - 30px)" }}
            className="me-2"
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
                    onClick={() => handleStartActivity(activity.id)}
                  >
                    <FontAwesomeIcon icon={faPlay} />
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
    </Container>
  );
};

export default Store;
