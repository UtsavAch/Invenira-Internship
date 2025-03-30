import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavItem } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "../contexts/user.context";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const CustomNavBar = () => {
  const { logOutUser, isUserLoggedIn } = React.useContext(UserContext);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const navigate = useNavigate();

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
        setIsLoggedIn(false);
        navigate("/login");
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
        {isLoggedIn && (
          <>
            <NavItem>
              <Link to="/live-iaps">My IAPs</Link>
            </NavItem>
            <NavItem>
              <Link to="/activities">My Activities</Link>
            </NavItem>
          </>
        )}
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
