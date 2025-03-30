import { Button, TextField } from "@mui/material";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/user.context";

const Login = () => {
  const navigate = useNavigate();
  const { emailPasswordLogin } = useContext(UserContext);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onFormInputChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await emailPasswordLogin(form.email, form.password);
      navigate("/profile"); // Redirect to profile after successful login
    } catch (error) {
      alert(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "300px",
        margin: "auto",
      }}
      onSubmit={onSubmit}
    >
      <h1>Login</h1>
      <TextField
        label="Email"
        type="email"
        variant="outlined"
        name="email"
        value={form.email}
        onChange={onFormInputChange}
        style={{ marginBottom: "1rem" }}
        required
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        name="password"
        value={form.password}
        onChange={onFormInputChange}
        style={{ marginBottom: "1rem" }}
        required
      />
      <Button variant="contained" color="primary" type="submit">
        Login
      </Button>
      <p>
        Don't have an account? <Link to="/signup">Signup</Link>
      </p>
    </form>
  );
};

export default Login;
