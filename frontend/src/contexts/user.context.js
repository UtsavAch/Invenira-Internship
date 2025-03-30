import { createContext, useState } from "react";

const API_BASE_URL = "http://localhost:8000";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

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
      return emailPasswordLogin(email, password);
    } catch (error) {
      throw error;
    }
  };

  // Modify the fetchUser function to be more reliable
  const fetchUser = async () => {
    // First check if we have a user in memory
    if (user) return user;

    // If no user in memory, return null (no persistent session)
    return null;
  };

  const logOutUser = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
      });
      setUser(null);
      return true;
    } catch (error) {
      console.error("Logout failed", error);
      return false;
    }
  };

  // Update isUserLoggedIn to be simpler
  const isUserLoggedIn = () => {
    return !!user;
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
