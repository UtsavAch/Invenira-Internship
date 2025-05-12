import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const IapDeployModal = ({ show, onHide, iap, onDeploy, loading }) => {
  const [objectives, setObjectives] = useState([
    { name: "", analytic_id: "", target: "" },
  ]);
  const [deployURL, setDeployURL] = useState("");
  const [analyticsOptions, setAnalyticsOptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show && iap) {
      // Fetch analytics for IAP's activities
      const fetchAnalytics = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/iaps/${iap.id}/analytics`
          );
          const data = await response.json();
          setAnalyticsOptions(data);
        } catch (err) {
          setError("Failed to load analytics");
        }
      };
      fetchAnalytics();
    }
  }, [show, iap]);

  const addObjective = () => {
    setObjectives([...objectives, { name: "", analytic_type: "", target: "" }]);
  };

  const removeObjective = (index) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setObjectives(newObjectives);
  };

  const handleObjectiveChange = (index, field, value) => {
    const newObjectives = [...objectives];
    newObjectives[index][field] = value;
    setObjectives(newObjectives);
  };

  const handleSubmit = () => {
    if (!deployURL) {
      setError("Deploy URL is required");
      return;
    }
    if (
      objectives.some((obj) => !obj.name || !obj.analytic_id || !obj.target)
    ) {
      setError("All objective fields are required");
      return;
    }
    onDeploy({ deployURL, objectives });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Deploy IAP: {iap?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-4">
          <Form.Label>Deployment URL</Form.Label>
          <Form.Control
            type="text"
            value={deployURL}
            onChange={(e) => setDeployURL(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Objectives</h5>
            <Button variant="primary" onClick={addObjective}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Objective
            </Button>
          </div>

          {objectives.map((obj, index) => (
            <Row key={index} className="mb-3">
              <Col>
                <Form.Control
                  placeholder="Objective Name"
                  value={obj.name}
                  onChange={(e) =>
                    handleObjectiveChange(index, "name", e.target.value)
                  }
                />
              </Col>
              <Col>
                <Form.Control
                  as="select"
                  value={obj.analytic_id}
                  onChange={(e) =>
                    handleObjectiveChange(index, "analytic_id", e.target.value)
                  }
                >
                  <option value="">Select Analytic</option>
                  {analyticsOptions.map((analytic) => (
                    <option key={analytic.id} value={analytic.id}>
                      {analytic.name} (ID: {analytic.id}, Activity:{" "}
                      {analytic.activity_id})
                    </option>
                  ))}
                </Form.Control>
              </Col>
              <Col>
                <Form.Control
                  type="number"
                  placeholder="Target"
                  value={obj.target}
                  onChange={(e) =>
                    handleObjectiveChange(index, "target", e.target.value)
                  }
                />
              </Col>
              <Col xs="auto">
                <Button variant="danger" onClick={() => removeObjective(index)}>
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              </Col>
            </Row>
          ))}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Deploying..." : "Deploy"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IapDeployModal;
