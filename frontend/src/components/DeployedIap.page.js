import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box,
  CircularProgress,
  Button,
  Modal,
  Slider,
  LinearProgress,
} from "@mui/material";
import { UserContext } from "../contexts/user.context";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function DeployedIapPage() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [deployedIap, setDeployedIap] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityProgress, setActivityProgress] = useState({}); // Track activity progress

  // Activity progress modal states
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [saveDisabled, setSaveDisabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch deployed IAP details
        const iapRes = await fetch(`${API_BASE_URL}/deployed-iaps/${id}`);
        if (!iapRes.ok) throw new Error("Failed to fetch IAP details");
        const iapData = await iapRes.json();
        setDeployedIap(iapData);

        // Fetch objectives
        const objRes = await fetch(
          `${API_BASE_URL}/deployed-iaps/${id}/objectives`
        );
        if (!objRes.ok) throw new Error("Failed to fetch objectives");
        const objData = await objRes.json();
        setObjectives(Array.isArray(objData) ? objData : []);

        // Fetch activities
        const actRes = await fetch(
          `${API_BASE_URL}/deployed-iaps/${id}/activities`
        );
        if (!actRes.ok) throw new Error("Failed to fetch activities");
        const actData = await actRes.json();
        setActivities(Array.isArray(actData) ? actData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Calculate objective progress based on activity progress
  const objectivesWithProgress = useMemo(() => {
    if (!activities.length || !objectives.length) {
      return objectives.map((obj) => ({ ...obj, progress: 0 }));
    }

    return objectives.map((obj) => {
      // Find activities for this objective
      const objActivities = activities.filter(
        (act) => act.objective_id === obj.id
      );

      if (!objActivities.length) return { ...obj, progress: 0 };

      // Calculate average progress
      const totalProgress = objActivities.reduce((sum, activity) => {
        return sum + (activityProgress[activity.activity_id] || 0);
      }, 0);

      const average = Math.round(totalProgress / objActivities.length);
      return { ...obj, progress: average };
    });
  }, [objectives, activities, activityProgress]);

  const handleOpenActivity = (activity) => {
    setSelectedActivity(activity);
    setProgressValue(activityProgress[activity.activity_id] || 0);
    setSaveDisabled(true);
  };

  const handleSliderChange = (event, newValue) => {
    setProgressValue(newValue);
    setSaveDisabled(false);
  };

  const handleSaveProgress = async () => {
    if (!user || !selectedActivity) return;

    try {
      // Save progress to backend
      const response = await fetch(`${API_BASE_URL}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          activity_id: selectedActivity.activity_id,
          deployed_iap_id: id,
          progress: progressValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to save progress");

      // Update local progress state
      setActivityProgress((prev) => ({
        ...prev,
        [selectedActivity.activity_id]: progressValue,
      }));

      // Close modal
      setSelectedActivity(null);
    } catch (error) {
      console.error("Failed to save progress:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  if (!deployedIap) {
    return <Typography variant="h6">Deployed IAP not found</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Activity Progress Modal */}
      <Modal
        open={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom align="center">
            {selectedActivity?.act_name}
          </Typography>

          <Box sx={{ mt: 4, mb: 4 }}>
            <Slider
              value={progressValue}
              onChange={handleSliderChange}
              aria-label="Activity Progress"
              valueLabelDisplay="auto"
              step={10}
              marks
              min={0}
              max={100}
            />
            <Typography variant="body2" align="center" mt={1}>
              Progress: {progressValue}%
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            disabled={saveDisabled}
            onClick={handleSaveProgress}
          >
            Save Progress
          </Button>
        </Box>
      </Modal>

      <Typography variant="h4" gutterBottom>
        {deployedIap.name}
      </Typography>

      <Typography variant="h5" gutterBottom>
        Objectives
      </Typography>
      <Paper elevation={3} sx={{ mb: 3, p: 2 }}>
        <List>
          {objectivesWithProgress.length > 0 ? (
            objectivesWithProgress.map((obj) => (
              <ListItem key={obj.id}>
                <Box sx={{ width: "100%", mr: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    {obj.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={obj.progress}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body1" fontWeight="bold">
                  {obj.progress}%
                </Typography>
              </ListItem>
            ))
          ) : (
            <Typography variant="body1">No objectives found</Typography>
          )}
        </List>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Activities
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        <List>
          {activities.length > 0 ? (
            activities.map((act) => (
              <ListItem
                key={`${act.iap_id}-${act.activity_id}`}
                secondaryAction={
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenActivity(act)}
                  >
                    Start
                  </Button>
                }
              >
                <ListItemText
                  primary={act.act_name}
                  secondary={`Deployment URL: ${act.deployment_url}`}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body1">No activities found</Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
}
