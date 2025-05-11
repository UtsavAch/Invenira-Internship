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
          `${API_BASE_URL}/activities?user_id=${user.id}&deployed=true`
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
          `http://localhost:8000/deployed-iaps/user/${user.id}`
        );
        const data = await response.json();
        setDeployedIaps(data);
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
      {/* Main Profile Section */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          minHeight: "90vh",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h4" sx={{ mb: 3 }}>
          PROFILE
        </Typography>

        <Typography variant="h5" sx={{ mb: 2 }}>
          My Deployed IAPs
        </Typography>

        {iapLoading ? (
          <Typography>Loading deployed IAPs...</Typography>
        ) : deployedIaps.length === 0 ? (
          <Typography>No deployed IAPs found</Typography>
        ) : (
          <Paper elevation={3} sx={{ p: 2 }}>
            <List>
              {deployedIaps.map((iap) => (
                <ListItem key={iap.id} divider>
                  <ListItemText
                    primary={iap.name}
                    secondary={`Deployed on: ${new Date(
                      iap.created_at
                    ).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
          Activities You Added
        </Typography>

        {iapLoading ? (
          <Typography>Loading activities...</Typography>
        ) : (
          <Paper elevation={3} sx={{ p: 2 }}>
            <List>
              {activitiesAdded.map((activity) => (
                <ListItem key={activity.id} divider>
                  <ListItemText
                    primary={activity.name}
                    secondary={`Added on: ${new Date(
                      activity.added_at
                    ).toLocaleDateString()}`}
                  />
                </ListItem>
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
