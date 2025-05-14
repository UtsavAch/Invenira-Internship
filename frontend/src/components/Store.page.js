import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../contexts/user.context";
import {
  Container,
  Navbar,
  Button,
  Form,
  ListGroup,
  Alert,
  Spinner,
  Card,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faInfo, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Store = () => {
  const { user, fetchUser } = useContext(UserContext);
  const [iaps, setIaps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await fetchUser();
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [fetchUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both IAPs and Activities in parallel
        const [iapsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/deployed-iaps`),
        ]);

        const activitiesResponse = await fetch(
          `${API_BASE_URL}/activities?deployed=true`
        );

        const iapsData = await iapsResponse.json();
        const activitiesData = await activitiesResponse.json();

        setIaps(iapsData);
        setActivities(activitiesData);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredIaps = iaps.filter((iap) =>
    iap.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleActivityInfo = (id) => {
    navigate(`/activity-info/${id}`);
  };

  const handleIapInfo = (id) => {
    navigate(`/iap-info/${id}`);
  };

  const handleAddActivity = async (activityId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/activities/${activityId}/add-to-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user?.id }),
        }
      );

      if (!response.ok) throw new Error("Failed to add activity");

      // Update local state
      setActivities(
        activities.map((a) =>
          a.id === activityId ? { ...a, is_added: true } : a
        )
      );

      setError(null);
    } catch (err) {
      setError(err.message);
    }
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
            placeholder="Search IAPs and Activities..."
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
        <>
          {/* IAPs Section */}
          <Card className="mb-4">
            <Card.Header as="h5">IAPs</Card.Header>
            <Card.Body>
              <ListGroup>
                {filteredIaps.length > 0 ? (
                  filteredIaps.map((iap) => (
                    <ListGroup.Item
                      key={iap.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div style={{ maxWidth: "70%" }}>
                        <h5>{iap.name}</h5>
                        {iap.properties && (
                          <small className="text-muted d-block">
                            Properties: {JSON.stringify(iap.properties)}
                          </small>
                        )}
                      </div>
                      <div>
                        <Button
                          variant="none"
                          size="sm"
                          onClick={() => handleIapInfo(iap.id)}
                          style={{
                            width: "30px",
                            height: "30px",
                            background: "#ccc",
                            borderRadius: "100%",
                          }}
                        >
                          <FontAwesomeIcon icon={faInfo} />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-center">
                    No IAPs found
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Activities Section */}
          <Card>
            <Card.Header as="h5">Activities</Card.Header>
            <Card.Body>
              <ListGroup>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    // In Store.page.js, update the activity list item
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
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <Button
                          variant="none"
                          size="sm"
                          onClick={() => handleActivityInfo(activity.id)}
                          style={{
                            width: "30px",
                            height: "30px",
                            background: "#ccc",
                            borderRadius: "100%",
                          }}
                        >
                          <FontAwesomeIcon icon={faInfo} />
                        </Button>
                        {user && !activity.is_added && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleAddActivity(activity.id)}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </Button>
                        )}
                        {activity.is_added && (
                          <span className="text-muted me-2">Added</span>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-center">
                    No activities found
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Store;
