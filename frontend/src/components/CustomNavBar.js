import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavItem } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "../contexts/user.context";
import { Link } from "react-router-dom";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate

// Convert the class component to a functional component
const CustomNavBar = () => {
  const { logOutUser, isUserLoggedIn } = React.useContext(UserContext); // Use useContext for easier access
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const navigate = useNavigate(); // Initialize navigate function

  // Check if user is logged in and update state
  React.useEffect(() => {
    const checkLoginStatus = async () => {
      const result = await isUserLoggedIn();
      setIsLoggedIn(result);
    };
    checkLoginStatus();
  }, [isUserLoggedIn]);

  const logOut = async () => {
    try {
      const loggedOut = await logOutUser();
      if (loggedOut) {
        setIsLoggedIn(false); // Update the state to reflect the logged-out status
        navigate("/login"); // Redirect to the login page
      }
    } catch (error) {
      alert(error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" style={{ marginBottom: "1em" }}>
      <Navbar.Brand href="#">Inven!RA</Navbar.Brand>
      <Nav className="mr-auto">
        <NavItem>
          <Link to="/">Store</Link>
        </NavItem>
        <NavItem>
          <Link to="/live-iaps">My IAPs</Link>
        </NavItem>
        <NavItem>
          <Link to="/activities">My Activities</Link>
        </NavItem>
      </Nav>
      {isLoggedIn ? (
        <Nav>
          <NavItem>
            <Link to="/profile">
              <FontAwesomeIcon icon={faCoffee} /> Profile
            </Link>
          </NavItem>
          <NavItem>
            <Button onClick={logOut} style={{ color: "gray" }}>
              Logout
            </Button>
          </NavItem>
        </Nav>
      ) : (
        <NavItem>
          <Link to="/login">
            <FontAwesomeIcon icon={faCoffee} /> Login
          </Link>
        </NavItem>
      )}
    </Navbar>
  );
};

export default CustomNavBar;

/*
import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavItem } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "../contexts/user.context";
import { Link, useNavigate } from "react-router-dom";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@mui/material";


export default class CustomNavBar extends Component {
  static contextType = UserContext;

  state = {
    isLoggedIn: false,
  };

  componentDidMount() {
    this.checkifLoggedIn().then((result) =>
      this.setState({
        isLoggedIn: result,
      })
    );
  }

  logOut = async () => {
    const { logOutUser } = this.context;
    try {
      // Calling the logOutUser function from the user context.
      const loggedOut = await logOutUser();
      // Now we will refresh the page, and the user will be logged out and
      // redirected to the login page because of the <PrivateRoute /> component.
      if (loggedOut) {
        window.location.reload(true);
      }
    } catch (error) {
      alert(error);
    }
  };

  checkifLoggedIn = async () => {
    const { isUserLoggedIn } = this.context;

    return isUserLoggedIn();
  };

  render() {
    let loginOrLogoutAndProfile;
    if (!this.state.isLoggedIn) {
      loginOrLogoutAndProfile = (
        <NavItem>
          <Link to="/login">
            <FontAwesomeIcon icon={faCoffee} /> Login
          </Link>
        </NavItem>
      );
    } else {
      loginOrLogoutAndProfile = (
        <Nav>
          <NavItem>
            <Link to="/profile">
              <FontAwesomeIcon icon={faCoffee} /> Profile
            </Link>
          </NavItem>
          <NavItem>
            <Button onClick={this.logOut} style={{ color: "gray" }}>
              Logout
            </Button>
          </NavItem>
        </Nav>
      );
    }

    return (
      <Navbar bg="dark" variant="dark" style={{ marginBottom: "1em" }}>
        <Navbar.Brand href="#">Inven!RA</Navbar.Brand>
        <Nav className="mr-auto">
          <NavItem>
            <Link to="/">Store</Link>
          </NavItem>
          <NavItem>
            <Link to="/live-iaps">My IAPs</Link>
          </NavItem>
          <NavItem>
            <Link to="/activities">My Activities</Link>
          </NavItem>
        </Nav>
        {loginOrLogoutAndProfile}
      </Navbar>
    );
  }
}

*/
