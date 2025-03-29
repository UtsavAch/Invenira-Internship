import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000/users"; // Adjust if needed

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Handle user creation
  const createUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (response.ok) {
        console.log("User created");
        fetchUsers(); // Refresh user list
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  // Handle user update
  const updateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (response.ok) {
        fetchUsers();
        setEditingUser(null);
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Handle user deletion
  const deleteUser = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <form onSubmit={editingUser ? updateUser : createUser} className="mb-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-2 border rounded w-full mb-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          {editingUser ? "Update User" : "Create User"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Users List</h2>
      <ul>
        {/*users.map((user) => (
          <li
            key={user.id}
            className="border p-2 rounded mb-2 flex justify-between items-center"
          >
            <div>
              <strong>{user.name}</strong> - {user.email}
            </div>
            <div>
              <button
                onClick={() => {
                  setEditingUser(user);
                  setName(user.name);
                  setEmail(user.email);
                  setPassword(""); // Don't show password
                }}
                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => deleteUser(user.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))*/}
      </ul>
    </div>
  );
};

export default UsersManager;
