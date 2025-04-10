import { Button, TextField } from "@mui/material";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/user.context";

const Signup = () => {
  const navigate = useNavigate();

  // As explained in the Login page.
  const { emailPasswordSignup, emailPasswordLogin } = useContext(UserContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // As explained in the Login page.
  const onFormInputChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      // Sign up the user
      await emailPasswordSignup(form.name, form.email, form.password);
      // Log in the user with the same credentials
      await emailPasswordLogin(form.email, form.password);
      navigate("/profile");
    } catch (error) {
      alert(error.message || "Signup failed. Please try again.");
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
    >
      <h1>Signup</h1>
      <TextField
        label="Name"
        type="name"
        variant="outlined"
        name="name"
        value={form.name}
        onInput={onFormInputChange}
        style={{ marginBottom: "1rem" }}
      />
      <TextField
        label="Email"
        type="email"
        variant="outlined"
        name="email"
        value={form.email}
        onInput={onFormInputChange}
        style={{ marginBottom: "1rem" }}
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        name="password"
        value={form.password}
        onInput={onFormInputChange}
        style={{ marginBottom: "1rem" }}
      />
      <Button variant="contained" color="primary" onClick={onSubmit}>
        Signup
      </Button>
      <p>
        Have an account already? <Link to="/login">Login</Link>
      </p>
    </form>
  );
};

export default Signup;
