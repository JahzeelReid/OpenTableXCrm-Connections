import React, { useEffect, useState } from "react";
import {
  Container,
  Fab,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PostEditor from "./Posteditor";
import PostList from "./Postlist";
import Analytics from "./Analytics";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./authContext";
import TopBanner from "./TopBanner";
import Sidebar from "./sidebar";
import CircularProgress from "@mui/material/CircularProgress";

export default function Dashboard(props) {
  const [openEditor, setOpenEditor] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);
  const formData = new FormData();
  formData.append("content", JSON.stringify(content));
  formData.append("title", "New Post Title");
  formData.append("image", image); // <-- the actual file
  const [dashboardStats, setDashboardStats] = useState({
    total_clicks: null,
    total_messages: null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    console.log("Post content:", content);
    console.log("Attached image:", image);
    setLoading(true);

    axios({
      method: "POST",
      url: `${props.url}/api/new_post`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
      .then((response) => {
        console.log("Post Submitted:", response.data);
        setOpenEditor(false);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        console.log(error.response);
        console.log(error.response.status);
        console.log(error.response.headers);
      });

    setLoading(false);
  };
  const check_company_state = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/check_company_state`,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Company State:", response.data);
        if (response.data.state === 1) {
          navigate("/menu");
        }
      })

      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        console.log(error.response);
      });
  };

  const fetchDashboardStats = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/dashboard_stats`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
      .then((response) => {
        console.log("Dashboard Stats:", response.data);
        setDashboardStats(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        console.log(error.response);
      });
  };

  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    check_company_state();
    fetchDashboardStats();
  }, [authReady, token]);

  return (
    <>
      {/* <Sidebar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Analytics url={props.url} />
        <PostList url={props.url} />

        
      </Container> */}
      <Sidebar />
      <Box
        sx={{
          display: "flex",
          bgcolor: "background.default",
          minHeight: "100vh",
          p: 4,
        }}
      >
        <Box component="main" sx={{ flexGrow: 1, ml: { sm: 32 } }}>
          {" "}
          {/* Offset for sidebar */}
          {/* Metric Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              {
                label: "TOTAL MESSAGES SENT",
                value: dashboardStats.total_messages,
              },
              { label: "TOTAL CLICKS", value: dashboardStats.total_clicks },
              // { label: "REVIEWS GENERATED", value: "120" },
            ].map((stat) => (
              <Grid item xs={12} md={4} key={stat.label}>
                <Paper
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "background.paper",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.05)", // Subtle definition
                  }}
                >
                  {stat.value !== null && stat.value !== undefined ? (
                    <Typography variant="h3" fontWeight="bold">
                      {stat.value}
                    </Typography>
                  ) : (
                    <CircularProgress />
                  )}

                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{ letterSpacing: 1.5 }}
                  >
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {/* Lower Content: Activity & Quick Actions */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography
                variant="h6"
                color="primary"
                sx={{ mb: 2, fontWeight: "bold" }}
              >
                TODAY'S ACTIVITY
              </Typography>
              <Analytics url={props.url} />{" "}
              {/* Ensure this returns a dark-styled list */}
              <PostList url={props.url} />
            </Grid>

            {/* <Grid item xs={12} md={4}>
              <QuickActionsCard />
            </Grid> */}
            <Fab
              color="primary"
              sx={{ position: "fixed", bottom: 30, right: 30 }}
              onClick={() => setOpenEditor(true)}
            >
              <AddIcon />
            </Fab>

            <PostEditor
              open={openEditor}
              onClose={() => setOpenEditor(false)}
              content={content}
              setContent={setContent}
              setImage={setImage}
              handleSubmit={handleSubmit}
              url={props.url}
              loading={loading}
            />
          </Grid>
        </Box>
      </Box>
    </>
  );
}
