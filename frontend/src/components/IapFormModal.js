import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const IapFormModal = ({
  show,
  onHide,
  onSubmit,
  formData: initialFormData,
  currentIap,
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

  const addProperty = () =>
    updatePairsAndProperties([...keyValuePairs, { key: "", value: "" }]);
  const removeProperty = (index) =>
    updatePairsAndProperties(keyValuePairs.filter((_, i) => i !== index));

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(localFormData);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{currentIap ? "Edit IAP" : "Create IAP"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
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
                <Button variant="danger" onClick={() => removeProperty(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="primary" onClick={addProperty}>
              Add Property
            </Button>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nodes (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="nodes"
              value={localFormData.nodes}
              onChange={handleInputChange}
              placeholder='Example: [{ "id": 1, "type": "start" }]'
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Edges (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="edges"
              value={localFormData.edges}
              onChange={handleInputChange}
              placeholder='Example: [{ "source": 1, "target": 2 }]'
            />
          </Form.Group>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {currentIap ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Form>
    </Modal>
  );
};

export default IapFormModal;
