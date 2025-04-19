// IapFormModal.js
import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const IapFormModal = ({
  show,
  onHide,
  onSubmit,
  formData: initialFormData,
  currentIap,
}) => {
  const [localFormData, setLocalFormData] = useState(initialFormData);
  const [keyValuePairs, setKeyValuePairs] = useState([]);
  const [jsonError, setJsonError] = useState("");
  const [activities, setActivities] = useState([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState({});

  useEffect(() => {
    setLocalFormData(initialFormData);
    const pairs = Object.entries(initialFormData.properties || {}).map(
      ([key, value]) => ({ key, value })
    );
    setKeyValuePairs(pairs);

    // If there are existing nodes (activities) in edit mode, pre-select them
    if (currentIap && currentIap.nodes) {
      // Reverse key-value pairs when loading existing nodes
      const reversedNodes = {};
      for (const key in currentIap.nodes) {
        reversedNodes[currentIap.nodes[key]] = key; // id: name
      }
      setSelectedActivityIds(reversedNodes);
    } else {
      setSelectedActivityIds({});
    }
  }, [initialFormData, currentIap]);

  // Fetch activities to populate the dropdown
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/activities?all=true`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        // Consider setting an error state to display a message to the user
      }
    };
    fetchActivities();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updatePairsAndProperties = (newPairs) => {
    setKeyValuePairs(newPairs);
    const properties = newPairs.reduce((acc, { key, value }) => {
      if (key.trim()) acc[key] = value;
      return acc;
    }, {});
    setLocalFormData((prev) => ({ ...prev, properties }));
  };

  const addProperty = () => {
    updatePairsAndProperties([...keyValuePairs, { key: "", value: "" }]);
  };

  const removeProperty = (index) => {
    const newPairs = keyValuePairs.filter((_, i) => i !== index);
    updatePairsAndProperties(newPairs);
  };

  const handleKeyChange = (index, key) => {
    const newPairs = [...keyValuePairs];
    newPairs[index].key = key;
    updatePairsAndProperties(newPairs);
  };

  const handleValueChange = (index, value) => {
    const newPairs = [...keyValuePairs];
    newPairs[index].value = value;
    updatePairsAndProperties(newPairs);
  };

  const validateJSON = (value) => {
    try {
      JSON.parse(value);
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const handleActivityChange = (activityId, checked) => {
    const activityName =
      activities.find((a) => a.id === activityId)?.name ||
      `activity_${activityId}`;
    if (checked) {
      setSelectedActivityIds((prevIds) => ({
        ...prevIds,
        [activityId]: activityName, // Store id:name
      }));
    } else {
      const updatedIds = { ...selectedActivityIds };
      delete updatedIds[activityId]; // Remove by ID
      setSelectedActivityIds(updatedIds);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...localFormData,
      nodes: selectedActivityIds, // Pass the id:name object
      edges: JSON.parse(localFormData.edges),
    });
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      style={{ maxHeight: "100%" }}
      contentClassName="d-flex flex-column"
    >
      <Modal.Header closeButton>
        <Modal.Title>{currentIap ? "Edit IAP" : "Create New IAP"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body
          className="d-flex flex-column"
          style={{ overflowY: "auto", height: "calc(90vh - 162px)" }}
        >
          <div className="flex-grow-1" style={{ overflowY: "auto" }}>
            <Form.Group className="mb-3">
              <Form.Label>IAP Name</Form.Label>
              <Form.Control
                name="name"
                value={localFormData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Properties</Form.Label>
              {keyValuePairs.map((pair, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <Form.Control
                    placeholder="Key"
                    value={pair.key}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                  />
                  <Form.Control
                    placeholder="Value"
                    value={pair.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  />
                  <Button
                    variant="danger"
                    onClick={() => removeProperty(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="primary" onClick={addProperty} className="mt-2">
                Add Property
              </Button>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nodes (Activities)</Form.Label>
              <div
                className="border p-2 rounded"
                style={{ maxHeight: "150px", overflowY: "auto" }}
              >
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="d-flex align-items-center mb-2"
                  >
                    <Form.Check
                      type="checkbox"
                      id={`activity-checkbox-${activity.id}`}
                      label={activity.name}
                      checked={!!selectedActivityIds[activity.id]} // Check by ID
                      onChange={(e) =>
                        handleActivityChange(activity.id, e.target.checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Edges (JSON array)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="edges"
                value={localFormData.edges}
                onChange={handleInputChange}
                isInvalid={!!jsonError}
              />
              <Form.Control.Feedback type="invalid">
                {jsonError}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          <div className="mt-auto pt-3 border-top">
            {jsonError && (
              <Alert variant="danger" className="mb-3">
                {jsonError}
              </Alert>
            )}
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={onHide}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {currentIap ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
};

export default IapFormModal;
