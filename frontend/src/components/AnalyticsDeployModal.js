import React, { useState } from "react";
import { Modal, Button, Form, Alert, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const AnalyticsDeployModal = ({ show, onHide, onSubmit }) => {
  const [analyticsList, setAnalyticsList] = useState([{ name: "" }]);
  const [error, setError] = useState("");

  const handleAddField = () => {
    setAnalyticsList([...analyticsList, { name: "" }]);
  };

  const handleSubmit = () => {
    const filtered = analyticsList.filter((a) => a.name.trim() !== "");
    if (filtered.length === 0) {
      setError("At least one analytic is required");
      return;
    }
    onSubmit(filtered);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add Analytics for Deployment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {analyticsList.map((analytic, index) => (
          <Row key={index} className="mb-2">
            <Col>
              <Form.Control
                placeholder={`Analytic ${index + 1} name`}
                value={analytic.name}
                onChange={(e) => {
                  const newList = [...analyticsList];
                  newList[index].name = e.target.value;
                  setAnalyticsList(newList);
                }}
              />
            </Col>
          </Row>
        ))}
        <Button variant="outline-primary" onClick={handleAddField}>
          <FontAwesomeIcon icon={faPlus} /> Add Analytic
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Deploy
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AnalyticsDeployModal;
