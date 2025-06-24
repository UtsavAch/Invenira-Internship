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
import StatisticsOverlay from "../components/StatisticsOverlay";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Store = () => {
  const { user, fetchUser } = useContext(UserContext);
  const [iaps, setIaps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statisticsOverlay, setStatisticsOverlay] = useState({
    open: false,
    iapId: null,
  });
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
          fetch(
            `${API_BASE_URL}/deployed-iaps${
              user?.id ? `?user_id=${user.id}` : ""
            }`
          ),
        ]);

        const activitiesResponse = await fetch(
          `${API_BASE_URL}/activities?deployed=true${
            user?.id ? `&user_id=${user.id}` : ""
          }`
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
  }, [user]);

  const filteredIaps = iaps.filter((iap) =>
    iap.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIapInfo = (id) => {
    setStatisticsOverlay({ open: true, iapId: id });
  };

  const handleCloseStatistics = () => {
    setStatisticsOverlay({ open: false, iapId: null });
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

  const handleAddIap = async (deployedIapId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/deployed-iaps/${deployedIapId}/add-to-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user?.id }),
        }
      );

      const data = await response.json(); // Parse JSON response

      if (!response.ok) {
        throw new Error(data.error || "Failed to add IAP");
      }

      setIaps(
        iaps.map((i) => (i.id === deployedIapId ? { ...i, is_added: true } : i))
      );
      setError(null);
    } catch (err) {
      setError(err.message);
      const res = await fetch(
        `${API_BASE_URL}/deployed-iaps?user_id=${user.id}`
      );
      const data = await res.json();
      setIaps(data);
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
                      style={{
                        backgroundColor: iap.is_owner ? "#e8f5e9" : "inherit",
                        borderRadius: "4px",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ maxWidth: "70%" }}>
                        <h5>{iap.name}</h5>
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
                        {user && !iap.is_added && !iap.is_owner && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleAddIap(iap.id)}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </Button>
                        )}
                        {iap.is_owner && (
                          <span className="text-success me-2">Owned</span>
                        )}
                        {iap.is_added && !iap.is_owner && (
                          <span className="text-muted me-2">Added</span>
                        )}
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
          {/* Activities Section */}
          <Card>
            <Card.Header as="h5">Activities</Card.Header>
            <Card.Body>
              <ListGroup>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <ListGroup.Item
                      key={activity.id}
                      className="d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: activity.is_owner
                          ? "#e8f5e9"
                          : "inherit",
                        borderRadius: "4px",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ maxWidth: "70%" }}>
                        <h5>{activity.name}</h5>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {user && (
                          <div>
                            {activity.is_owner ? (
                              <span className="text-success me-2">Owned</span>
                            ) : activity.is_added ? (
                              <span className="text-muted me-2">Added</span>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAddActivity(activity.id)}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </Button>
                            )}
                          </div>
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
      <StatisticsOverlay
        iapId={statisticsOverlay.iapId}
        open={statisticsOverlay.open}
        onClose={handleCloseStatistics}
      />
    </Container>
  );
};

export default Store;
