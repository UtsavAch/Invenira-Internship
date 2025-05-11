import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { ArrowUp, ArrowDown } from "react-bootstrap-icons";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const IapFormModal = ({
  show,
  onHide,
  onSubmit,
  formData: initialFormData,
  currentIap,
  user,
}) => {
  const [localFormData, setLocalFormData] = useState(initialFormData);
  const [keyValuePairs, setKeyValuePairs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [orderedActivityIds, setOrderedActivityIds] = useState([]);

  useEffect(() => {
    setLocalFormData(initialFormData);
    const pairs = Object.entries(initialFormData.properties || {}).map(
      ([key, value]) => ({ key, value })
    );
    setKeyValuePairs(pairs);

    if (currentIap?.nodes) {
      const initialIds = currentIap.nodes.map((node) => node.id);
      setOrderedActivityIds(initialIds);
    } else {
      setOrderedActivityIds([]);
    }
  }, [initialFormData, currentIap]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/activities?user_id=${user.id}&deployed=true`
        );
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    };
    fetchActivities();
  }, [user]);

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

  const handleActivityChange = (activityId, checked) => {
    if (checked) {
      setOrderedActivityIds((prev) => [...prev, activityId]);
    } else {
      setOrderedActivityIds((prev) => prev.filter((id) => id !== activityId));
    }
  };

  const moveActivity = (activityId, direction) => {
    setOrderedActivityIds((prevIds) => {
      const currentIndex = prevIds.indexOf(activityId);
      if (
        (direction === "up" && currentIndex > 0) ||
        (direction === "down" && currentIndex < prevIds.length - 1)
      ) {
        const newIds = [...prevIds];
        const swapIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;
        [newIds[currentIndex], newIds[swapIndex]] = [
          newIds[swapIndex],
          newIds[currentIndex],
        ];
        return newIds;
      }
      return prevIds;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nodes = orderedActivityIds.map((activityId) => ({
      id: activityId,
      name:
        activities.find((a) => a.id === activityId)?.name ||
        `activity_${activityId}`,
    }));

    let edges = orderedActivityIds.slice(0, -1).map((currentId, index) => {
      const nextId = orderedActivityIds[index + 1];
      return {
        source: currentId,
        target: nextId,
        label: "not-completed",
      };
    });
    // Add validation to ensure nodes and edges match
    if (orderedActivityIds.length >= 1 && edges.length === 0) {
      // Clear existing edges if only 1 node remains
      edges = [];
    }

    onSubmit({
      ...localFormData,
      nodes,
      edges,
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
              <Button
                variant="primary"
                onClick={addProperty}
                className="mt-2"
                style={{ marginLeft: "10px" }}
              >
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
                      checked={orderedActivityIds.includes(activity.id)}
                      onChange={(e) =>
                        handleActivityChange(activity.id, e.target.checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Edges (Activity Order)</Form.Label>
              <div
                className="border p-2 rounded"
                style={{ maxHeight: "150px", overflowY: "auto" }}
              >
                {orderedActivityIds.length > 0 ? (
                  <ul className="list-group">
                    {orderedActivityIds.map((activityId, index) => {
                      const activityName =
                        activities.find((a) => a.id === activityId)?.name ||
                        `Activity ${activityId}`;
                      return (
                        <li
                          key={activityId}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {activityName}
                          <div>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => moveActivity(activityId, "up")}
                              disabled={index === 0}
                              className="me-1"
                            >
                              <ArrowUp size={16} />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => moveActivity(activityId, "down")}
                              disabled={index === orderedActivityIds.length - 1}
                            >
                              <ArrowDown size={16} />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted">Select the activities first.</p>
                )}
              </div>
            </Form.Group>
          </div>

          <div className="mt-auto pt-3 border-top">
            <div
              className="d-flex justify-content-end gap-2"
              style={{ display: "flex", gap: "10px" }}
            >
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
