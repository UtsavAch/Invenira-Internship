import { createContext, useState } from "react";

// Base URL for your API (adjust according to your environment)
const API_BASE_URL = "http://localhost:8000";

// Creating a user context to manage and access all the user related functions
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Function to log in user using your backend API
  const emailPasswordLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const authenticatedUser = await response.json();
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Function to sign up user using your backend API
  const emailPasswordSignup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Signup failed");
      }

      const newUser = await response.json();

      // Automatically log in after signup
      return emailPasswordLogin(email, password);
    } catch (error) {
      throw error;
    }
  };

  // Function to fetch the current user
  const fetchUser = async () => {
    try {
      // You'll need to implement a /me endpoint or use your current session
      // This is a placeholder - adjust based on your auth implementation
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: "include", // For cookies if using session auth
      });

      if (!response.ok) {
        return false;
      }

      const currentUser = await response.json();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Failed to fetch user", error);
      return false;
    }
  };

  // Function to logout user
  const logOutUser = async () => {
    try {
      // You might need a logout endpoint if using sessions
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include", // For cookies if using session auth
      });

      setUser(null);
      return true;
    } catch (error) {
      console.error("Logout failed", error);
      return false;
    }
  };

  // Check if user is logged in
  const isUserLoggedIn = async () => {
    return !!user || (await fetchUser());
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        fetchUser,
        emailPasswordLogin,
        emailPasswordSignup,
        logOutUser,
        isUserLoggedIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
