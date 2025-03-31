import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/user.context";
import { Typography, Box } from "@mui/material";
import PersonalInfo from "../components/PersonalInfo";

export default function ProfilePage() {
  const { user, fetchUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

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
    <Box
      sx={{
        display: "flex",
      }}
    >
      {/* Main Profile Section */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h4">PROFILE</Typography>
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
