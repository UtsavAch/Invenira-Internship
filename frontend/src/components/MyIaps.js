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
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import IapFormModal from "./IapFormModal";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MyIaps = () => {
  const [iaps, setIaps] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentIap, setCurrentIap] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    properties: {},
    nodes: "[]",
    edges: "[]",
  });

  useEffect(() => {
    const fetchIaps = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/iaps?all=true`);
        const data = await response.json();
        setIaps(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch IAPs");
        setLoading(false);
      }
    };

    fetchIaps();
  }, []);

  const filteredIaps = iaps.filter((iap) =>
    iap.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (formData) => {
    try {
      const parsedData = {
        ...formData,
        nodes: JSON.parse(formData.nodes),
        edges: JSON.parse(formData.edges),
      };

      const url = currentIap
        ? `${API_BASE_URL}/iaps/${currentIap.id}`
        : `${API_BASE_URL}/iaps`;

      const method = currentIap ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) throw new Error("Operation failed");
      const updatedIap = await response.json();

      if (currentIap) {
        setIaps(
          iaps.map((iap) => (iap.id === updatedIap.id ? updatedIap : iap))
        );
      } else {
        setIaps([...iaps, updatedIap]);
      }

      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/iaps/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      setIaps(iaps.filter((iap) => iap.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (iap) => {
    setCurrentIap(iap);
    setFormData({
      name: iap.name,
      properties: iap.properties || {},
      nodes: JSON.stringify(iap.nodes, null, 2),
      edges: JSON.stringify(iap.edges, null, 2),
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setCurrentIap(null);
    setFormData({
      name: "",
      properties: {},
      nodes: "[]",
      edges: "[]",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentIap(null);
    setError(null);
  };

  return (
    <Container className="mt-4">
      <Navbar bg="light" className="mb-4 p-3 rounded">
        <Navbar.Brand>IAPs</Navbar.Brand>
        <Button variant="primary" onClick={handleCreate} className="ms-auto">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create IAP
        </Button>
      </Navbar>

      <Form.Group className="mb-4">
        <div
          className="d-flex align-items-center"
          style={{ width: "500px", gap: "30px" }}
        >
          <Form.Control
            type="text"
            placeholder="Search IAPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="text-muted" />
        </div>
      </Form.Group>

      {error && (
        <Alert variant="danger" dismissible>
          {error}
        </Alert>
      )}

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <ListGroup>
          {filteredIaps.map((iap) => (
            <ListGroup.Item
              key={iap.id}
              className="d-flex justify-content-between"
            >
              <div>
                <h5>{iap.name}</h5>
                <small className="text-muted">
                  Nodes: {iap.nodes?.length || 0}
                </small>
              </div>
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEdit(iap)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(iap.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <IapFormModal
        show={showModal}
        onHide={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        currentIap={currentIap}
      />
    </Container>
  );
};

export default MyIaps;
