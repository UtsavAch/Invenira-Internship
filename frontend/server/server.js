const express = require("express");
const cors = require("cors");
const { ServiceBroker, Errors } = require("moleculer");

const app = express();
app.use(express.json());
app.use(cors());
const port = 8000;

const broker = new ServiceBroker({
  nodeID: "gateway",
});

broker.loadService("../../backend/services/activity_connections.service.js");
broker.loadService("../../backend/services/scores.service.js");
broker.loadService("../../backend/services/users.service.js");
broker.loadService("../../backend/services/activity.service.js");
broker.loadService("../../backend/services/iap.service.js");
broker.loadService("../../backend/services/deployed_iaps.service.js");

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

///////////HANDLING USERS///////////////////////
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

// Update the user data
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

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await broker.call("users.login", { email, password });
    // Return the full user object including ID
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/users/logout", async (req, res) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

/////////////////////////////////////
///////////HANDLING ACTIVITIES///////////////////////
// List all activities
app.get("/activities", async (req, res) => {
  try {
    const activities = await broker.call("activity.list", {
      all: req.query.all,
      name: req.query.name,
      user_id: req.query.user_id,
      deployed: req.query.deployed,
      owner: req.query.owner,
      profile: req.query.profile,
    });
    res.json(activities);
  } catch (error) {
    console.error("Activities list error:", error);
    handleError(res, error);
  }
});

// Create a new activity
app.post("/activities", async (req, res) => {
  const {
    name,
    properties,
    config_url,
    json_params,
    user_url,
    analytics,
    user_id,
  } = req.body; // Extract user_id
  try {
    const newActivity = await broker.call("activity.create", {
      name,
      properties,
      config_url,
      json_params,
      user_url,
      analytics,
      user_id, // Pass user_id to service
    });
    res.status(201).json(newActivity);
  } catch (error) {
    handleError(res, error);
  }
});

// Get activity by ID
app.get("/activities/:id", async (req, res) => {
  try {
    const activity = await broker.call("activity.get", { id: req.params.id });
    res.json(activity);
  } catch (error) {
    handleError(res, error);
  }
});

// Update the activity data
app.put("/activities/:id", async (req, res) => {
  const { user_id, ...updateData } = req.body; // Get user_id
  try {
    const updatedActivity = await broker.call("activity.update", {
      id: req.params.id,
      user_id, // Pass authenticated user's ID
      ...updateData,
    });
    res.json(updatedActivity);
  } catch (error) {
    handleError(res, error);
  }
});

// Delete activity
app.delete("/activities/:id", async (req, res) => {
  const { user_id } = req.body; // Get user_id
  try {
    await broker.call("activity.remove", {
      id: req.params.id,
      user_id, // Pass authenticated user's ID
    });
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

//Deploy an activity
app.post("/activities/:id/deploy", async (req, res) => {
  try {
    const result = await broker.call("activity.deploy", {
      id: req.params.id,
      user_id: req.body.user_id,
      analytics: req.body.analytics,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

// List all deployed IAPs
app.get("/analytics", async (req, res) => {
  try {
    const analytics = await broker.call("activity.listAnalytics");
    res.json(Array.isArray(analytics) ? analytics : []);
  } catch (error) {
    handleError(res, error);
  }
});

// User adds the activity
app.post("/activities/:id/add-to-user", async (req, res) => {
  try {
    const result = await broker.call("activity.addToUser", {
      activity_id: req.params.id,
      user_id: req.body.user_id,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

/////////////////////////////////////
///////////HANDLING IAPS///////////////////////
// List all IAPs
app.get("/iaps", async (req, res) => {
  try {
    const iaps = await broker.call("iap.list", {
      all: req.query.all,
      name: req.query.name,
      user_id: req.query.user_id,
    });
    res.json(Array.isArray(iaps) ? iaps : []);
  } catch (error) {
    handleError(res, error);
  }
});

// Create a new IAP
app.post("/iaps", async (req, res) => {
  const { name, properties, nodes, edges, user_id } = req.body;
  try {
    const newIap = await broker.call("iap.create", {
      name,
      properties,
      nodes,
      edges,
      user_id,
    });
    res.status(201).json(newIap);
  } catch (error) {
    handleError(res, error);
  }
});

// Get IAP by ID
app.get("/iaps/:id", async (req, res) => {
  try {
    const iap = await broker.call("iap.get", { id: req.params.id });
    res.json(iap);
  } catch (error) {
    handleError(res, error);
  }
});

// Update IAP
app.put("/iaps/:id", async (req, res) => {
  const { name, properties, nodes, edges, user_id } = req.body;
  try {
    const updatedIap = await broker.call("iap.update", {
      id: req.params.id,
      name,
      properties,
      nodes,
      edges,
      user_id,
    });
    res.json(updatedIap);
  } catch (error) {
    handleError(res, error);
  }
});

// Delete IAP
app.delete("/iaps/:id", async (req, res) => {
  const { user_id } = req.body;
  try {
    await broker.call("iap.remove", { id: req.params.id, user_id });
    res.json({ message: "IAP deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

// Get analytics for IAP's activities
app.get("/iaps/:id/analytics", async (req, res) => {
  try {
    const analytics = await broker.call("iap.getAnalytics", {
      id: req.params.id,
    });
    res.json(analytics);
  } catch (error) {
    handleError(res, error);
  }
});

// Deploy IAP
app.post("/iaps/:id/deploy", async (req, res) => {
  try {
    const result = await broker.call("iap.deploy", {
      id: req.params.id,
      deployURL: req.body.deployURL,
      objectives: req.body.objectives,
      activityUrls: req.body.activityUrls,
      user_id: req.body.user_id,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/activity-connections", async (req, res) => {
  try {
    const connections = await broker.call("activity_connections.list");
    res.json(connections);
  } catch (error) {
    handleError(res, error);
  }
});

/////////////////////////////////////
///////////HANDLING DEPLOYED IAPS///////////////////////

app.get("/deployed-iaps", async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const deployed_iaps = await broker.call(
      "deployed_iaps.getAllDeployedIaps",
      { user_id }
    );
    res.json(deployed_iaps);
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/deployed-iaps/:id/add-to-user", async (req, res) => {
  try {
    const result = await broker.call("deployed_iaps.addToUser", {
      deployed_iap_id: req.params.id,
      user_id: req.body.user_id,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

// Get a deployed IAP by ID
app.get("/deployed-iaps/:id", async (req, res) => {
  try {
    const deployedIap = await broker.call("deployed_iaps.getDeployedIap", {
      id: req.params.id,
    });
    res.json(deployedIap);
  } catch (error) {
    handleError(res, error);
  }
});

// Get objectives for a deployed IAP
app.get("/deployed-iaps/:id/objectives", async (req, res) => {
  try {
    const objectives = await broker.call("deployed_iaps.getObjectives", {
      id: req.params.id,
    });
    res.json(objectives);
  } catch (error) {
    handleError(res, error);
  }
});

// Get activities for a deployed IAP
app.get("/deployed-iaps/:id/activities", async (req, res) => {
  try {
    const activities = await broker.call("deployed_iaps.getActivities", {
      id: req.params.id,
    });
    res.json(activities);
  } catch (error) {
    handleError(res, error);
  }
});

///////////////////////////////
app.post("/progress", async (req, res) => {
  try {
    const result = await broker.call("scores.recordProgress", req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

// app.get("/progress", async (req, res) => {
//   try {
//     const progress = await broker.call("scores.getActivityProgress", {
//       user_id: req.query.user_id,
//       deployed_iap_id: req.query.deployed_iap_id,
//       activity_id: req.query.activity_id,
//     });
//     res.json({ progress });
//   } catch (error) {
//     handleError(res, error);
//   }
// });
app.get("/progress_all", async (req, res) => {
  try {
    const progress = await broker.call("scores.getDeployedIapProgress", {
      user_id: req.query.user_id,
      deployed_iap_id: req.query.deployed_iap_id,
      //activity_id: req.query.activity_id,
    });
    res.json(progress);
  } catch (error) {
    handleError(res, error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
