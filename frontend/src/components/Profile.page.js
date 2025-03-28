import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/user.context";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
//import CameraIcon from '@mui/icons-material/PhotoCamera';
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
//import Link from '@mui/material/Link';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Navbar, Nav, NavItem } from "react-bootstrap";
import { Link } from "react-router-dom";

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const cards = [1, 2, 3];

const theme = createTheme();

export default function Album() {
  const { user, fetchUser } = useContext(UserContext);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const fetchedUser = await fetchUser();
      setUserData(fetchedUser);
      console.log(fetchedUser);
    };
    getUserData();
  }, [fetchUser]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Button variant="outlined">
        <Link to="/c">My Iaps</Link>
      </Button>
      <Button variant="outlined">
        <Link to="/myActivities">My Activities</Link>
      </Button>
      <main>
        {/* Hero unit */}
        <Box
          sx={{
            bgcolor: "background.paper",
            pt: 8,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              variant="h2"
              align="center"
              color="text.primary"
              gutterBottom
            >
              User Profile
            </Typography>
            {userData ? (
              <>
                <Typography
                  variant="h5"
                  align="center"
                  color="text.secondary"
                  paragraph
                >
                  Welcome, {userData.profile.name}
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary">
                  Email: {userData.email}
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary">
                  User ID: {userData.id}
                </Typography>
              </>
            ) : (
              <Typography variant="h6" align="center" color="text.secondary">
                Loading user data...
              </Typography>
            )}
            <Stack
              sx={{ pt: 4 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Button variant="contained">Main call to action</Button>
              <Button variant="outlined">Secondary action</Button>
            </Stack>
          </Container>
        </Box>
        <Container sx={{ py: 8 }} maxWidth="md">
          {/* End hero unit */}
          <Grid container spacing={4}>
            {cards.map((card) => (
              <Grid item key={card} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      // 16:9
                      pt: "56.25%",
                    }}
                    image="https://source.unsplash.com/random"
                    alt="random"
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      Heading
                    </Typography>
                    <Typography>
                      This is a media card. You can use this section to describe
                      the content.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">View</Button>
                    <Button size="small">Edit</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </main>
      {/* Footer */}
      <Box sx={{ bgcolor: "background.paper", p: 6 }} component="footer">
        <Typography variant="h6" align="center" gutterBottom>
          Footer
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          component="p"
        >
          Something here to give the footer a purpose!
        </Typography>
        <Copyright />
      </Box>
      {/* End footer */}
    </ThemeProvider>
  );
}
