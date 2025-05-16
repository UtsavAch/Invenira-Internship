import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/user.context";
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";
import PersonalInfo from "../components/PersonalInfo";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export default function ProfilePage() {
  const { user, fetchUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [deployedIaps, setDeployedIaps] = useState([]);
  const [iapLoading, setIapLoading] = useState(false);
  const [activitiesAdded, setActivitiesAdded] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await fetchUser();
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [fetchUser]);

  useEffect(() => {
    const fetchAddedActivities = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/activities?user_id=${user.id}&profile=true`
        );
        const data = await response.json();
        setActivitiesAdded(data);
      } catch (error) {
        console.error("Failed to fetch added activities:", error);
      }
    };

    fetchAddedActivities();
  }, [user?.id]);

  useEffect(() => {
    const fetchDeployedIaps = async () => {
      if (!user?.id) return;

      setIapLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/deployed-iaps?user_id=${user.id}`
        );
        const data = await response.json();

        const userIaps = data.filter((iap) => iap.is_added || iap.is_owner);
        setDeployedIaps(userIaps);
      } catch (error) {
        console.error("Failed to fetch deployed IAPs:", error);
      } finally {
        setIapLoading(false);
      }
    };
    fetchDeployedIaps();
  }, [user?.id]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">Loading profile...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">
          No user data available. Please log in.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Box
        sx={{
          flex: 1,
          p: 3,
          minHeight: "90vh",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Your IAP collection
        </Typography>

        {iapLoading ? (
          <Typography>Loading deployed IAPs...</Typography>
        ) : deployedIaps.length === 0 ? (
          <Typography>No deployed IAPs found</Typography>
        ) : (
          <Paper elevation={3} sx={{ p: 2 }}>
            <List>
              {deployedIaps.map((iap) => (
                <ListItem
                  key={iap.id}
                  divider
                  sx={{
                    backgroundColor: iap.is_owner ? "#e8f5e9" : "inherit",
                    borderRadius: "4px",
                    marginBottom: "8px",
                  }}
                >
                  <ListItemText primary={iap.name} />
                  {iap.is_owner && (
                    <Typography variant="caption" color="textSecondary">
                      (Owner)
                    </Typography>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
          Your activity Collection
        </Typography>

        {iapLoading ? (
          <Typography>Loading activities...</Typography>
        ) : (
          <Paper elevation={3} sx={{ p: 2 }}>
            <List>
              {activitiesAdded.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    backgroundColor: activity.is_owner ? "#e8f5e9" : "white",
                    padding: "10px",
                    margin: "5px",
                  }}
                >
                  {activity.name} {activity.is_owner && "(Owned)"}
                </div>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Personal Info - Right Sidebar */}
      <Box
        sx={{
          width: "350px",
          height: "90vh",
          position: "sticky",
          top: "10vh",
          borderLeft: "1px solid #ddd",
          boxShadow: "-2px 0px 5px rgba(0, 0, 0, 0.1)",
          backgroundColor: "white",
          overflowY: "auto",
        }}
      >
        <PersonalInfo />
      </Box>
    </Box>
  );
}
