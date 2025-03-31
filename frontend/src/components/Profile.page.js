import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/user.context";
import { Typography, Container, Box } from "@mui/material";
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
      <Container maxWidth="md">
        <Typography variant="h6" align="center" mt={4}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md">
        <Typography variant="h6" align="center" mt={4}>
          No user data available. Please log in.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        {/* Main profile details */}
        PROFILE
        {/* Personal Info Component */}
        <PersonalInfo />
      </Box>
    </Container>
  );
}
