import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/user.context";
import { Typography, Container, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, fetchUser } = useContext(UserContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await fetchUser();
        setUserData(currentUser);
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
      <Container maxWidth="sm">
        <Typography variant="h6" align="center" mt={4}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h6" align="center" mt={4}>
          No user data available. Please log in.
        </Typography>
        <Box textAlign="center" mt={2}>
          <Button variant="contained" component={Link} to="/login">
            Go to Login
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, p: 3, border: "1px solid #ddd", borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          User Profile
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Name:</Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            {userData.name || "Not specified"}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Email:</Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            {userData.email}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">User ID:</Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            {userData.id}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
