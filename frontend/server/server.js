const express = require("express");
const cors = require("cors");
const { ServiceBroker, Errors } = require("moleculer");

const app = express();
app.use(express.json());
app.use(cors());
const port = 8000;

const broker = new ServiceBroker({
  nodeID: "gateway",
  // transporter: "NATS",
});

broker.loadService("../../backend/services/users.service.js");

// Start the broker
broker.start().then(() => {
  console.log("Moleculer service broker started");
});

// Helper function to handle errors
const handleError = (res, error) => {
  if (error instanceof Errors.MoleculerError) {
    res.status(error.code || 500).json({ error: error.message });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
    console.error("Unexpected error:", error);
  }
};

// List all users
app.get("/users", async (req, res) => {
  try {
    const users = await broker.call("users.list");
    res.json(users);
  } catch (error) {
    handleError(res, error);
  }
});

// Create a new user
app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const newUser = await broker.call("users.create", {
      name,
      email,
      password,
    });
    res.status(201).json(newUser);
  } catch (error) {
    handleError(res, error);
  }
});

// Get user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await broker.call("users.get", { id: req.params.id });
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
});

// Update a user
app.put("/users/:id", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const updatedUser = await broker.call("users.update", {
      id: req.params.id,
      name,
      email,
      password,
    });
    res.json(updatedUser);
  } catch (error) {
    handleError(res, error);
  }
});

// Delete a user
app.delete("/users/:id", async (req, res) => {
  try {
    await broker.call("users.remove", { id: req.params.id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
