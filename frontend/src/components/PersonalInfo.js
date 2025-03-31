import React, { useState, useContext } from "react";
import { UserContext } from "../contexts/user.context";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField } from "@mui/material";

const API_BASE_URL = "http://localhost:8000";

export default function PersonalInfo() {
  const { user, setUser, logOutUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">No user data available.</Typography>
      </Box>
    );
  }

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Update name & email (requires current password)
  const handleUpdateInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.currentPassword, // Required for confirmation
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Failed to update profile. Check your current password."
        );
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditMode(false);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // Change password (must match current password)
  const handleChangePassword = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: passwordData.currentPassword, // Verify current password
          newPassword: passwordData.newPassword, // New password
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Current password is incorrect or new password is invalid."
        );
      }

      alert("Password updated successfully!");
      setUpdatingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (error) {
      console.error("Password update error:", error);
    }
  };

  // Delete account
  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/${user.id}`, { method: "DELETE" });
      await logOutUser();
      navigate("/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  return (
    <Box
      sx={{ p: 3, border: "1px solid #ddd", borderRadius: 2, width: "350px" }}
    >
      <Typography variant="h6" gutterBottom>
        Personal Info
      </Typography>

      {!editMode && !updatingPassword ? (
        <>
          <Typography>
            <strong>Name:</strong> {user.name}
          </Typography>
          <Typography>
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography>
            <strong>Password:</strong> {user.password}
          </Typography>

          <Button
            variant="contained"
            onClick={() => setEditMode(true)}
            sx={{ mt: 2, mr: 1 }}
          >
            Edit Info
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setUpdatingPassword(true)}
            sx={{ mt: 2, mr: 1 }}
          >
            Change Password
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            sx={{ mt: 2 }}
          >
            Delete Account
          </Button>
        </>
      ) : (
        <>
          {editMode && (
            <>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleUpdateInfo}
                sx={{ mr: 1 }}
              >
                Update Info
              </Button>
              <Button variant="outlined" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </>
          )}

          {updatingPassword && (
            <>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleChangePassword}
                sx={{ mr: 1 }}
              >
                Change Password
              </Button>
              <Button
                variant="outlined"
                onClick={() => setUpdatingPassword(false)}
              >
                Cancel
              </Button>
            </>
          )}
        </>
      )}
    </Box>
  );
}
