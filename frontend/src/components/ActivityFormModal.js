import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ActivityFormModal = ({
  show,
  onHide,
  onSubmit,
  formData: initialFormData,
  currentActivity,
}) => {
  const [localFormData, setLocalFormData] = useState(initialFormData);
  const [keyValuePairs, setKeyValuePairs] = useState([]);

  useEffect(() => {
    setLocalFormData(initialFormData);
    const pairs = Object.entries(initialFormData.properties || {}).map(
      ([key, value]) => ({ key, value })
    );
    setKeyValuePairs(pairs);
  }, [initialFormData]);

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

  // Submit updated form data
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(localFormData);
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
        <Modal.Title>
          {currentActivity ? "Edit Activity" : "Create New Activity"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body
          className="d-flex flex-column"
          style={{ overflowY: "auto", height: "calc(55vh - 162px)" }}
        >
          <div className="flex-grow-1" style={{ overflowY: "auto" }}>
            <Form.Group className="mb-3">
              <Form.Label>Activity Name</Form.Label>
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
                {currentActivity ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
};

export default ActivityFormModal;
