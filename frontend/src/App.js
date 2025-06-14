import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { UserProvider } from "./contexts/user.context";
import Home from "./components/Home.page";
import Login from "./components/Login.page";
import Signup from "./components/Signup.page";
import CustomNavBar from "./components/CustomNavBar";
import Profile from "./components/Profile.page";
import MyIaps from "./components/MyIaps.page";
import MyActivities from "./components/MyActivities.page";
import Store from "./components/Store.page";
import UsersManager from "./components/UsersManager.page";
import DeployedIapPage from "./components/DeployedIap.page";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

//const db = require('./database');
axios.defaults.baseURL = "http://localhost:8000";

class App extends Component {
  componentDidMount() {
    //console.log("Here");
    axios
      .get("/users") // Assuming the server is running on the same host and port as your React app
      .then((response) => {
        // Handle the response data
        //console.log(response.data);
      })
      .catch((error) => {
        // Handle any errors
        //console.error(error);
      });
  }

  render() {
    console.log("env: " + JSON.stringify(process.env));
    return (
      <Router basename={process.env.PUBLIC_URL}>
        <div>
          <UserProvider>
            <CustomNavBar />
            <Routes>
              <Route exact path="/usersManager" element={<UsersManager />} />
              <Route exact path="/" element={<Home />} />
              <Route exact path="/customNavBar" element={<CustomNavBar />} />
              <Route exact path="/edit-iap/:id" element={<this.EditIAP />} />
              <Route exact path="/iaps" element={<MyIaps />} />
              <Route exact path="/activities" element={<MyActivities />} />
              <Route exact path="/store" element={<Store />} />
              <Route
                exact
                path="/act-analytics/1"
                element={<this.LoadActivityAnalytics />}
              />
              <Route path="/iap-analytics/:id" element={<this.Analitics />} />

              <Route exact path="/login" element={<Login />} />
              <Route exact path="/signup" element={<Signup />} />
              <Route exact path="/profile" element={<Profile />} />
              <Route path="/deployed-iaps/:id" element={<DeployedIapPage />} />

              {/* We are protecting our Home Page from unauthenticated */}
              {/* users by wrapping it with PrivateRoute here. Put private pages here*/}
              {/* <Route element={<PrivateRoute />}></Route> */}
            </Routes>
          </UserProvider>
        </div>
      </Router>
    );
  }
}

export default App;
