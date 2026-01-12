import React, { useState, useEffect } from "react";
// import { Container, Fab, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  Select,
  Button,
  Fab,
} from "@mui/material";
import { useContext } from "react";
import { AuthContext } from "./authContext";
import TopBanner from "./TopBanner";
import PostEditor from "./Posteditor";
import AddIcon from "@mui/icons-material/Add";
import Sidebar from "./sidebar";
import PostCalendar from "./Calender";

const TOTAL_DAYS = 12;
// Get tota; days from backend in future may change per company

export default function DayScheduler(props) {
  const [openEditor, setOpenEditor] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const formData = new FormData();
  formData.append("content", JSON.stringify(content));
  formData.append("title", "New Post Title");
  formData.append("image", image); // <-- the actual file
  const [loading, setLoading] = useState(false);

  const handlePostSubmit = () => {
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
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);

  const isAuto = (day) => day.mode === "auto";

  // const hasError = (day, value) => isAuto(day) && !value;/

  const hasError = (day, value) =>
    isAuto(day) && (value === "" || value === null || value === undefined);

  const promotion = [
    "Reservations",
    "Featured Dish",
    "Featured Drink",
    "Dessert Special",
    "Event / Entertainment Night",
    "Happy Hour",
    "Brunch",
    "Catering Service",
    "Customer Win-Back",
    "New Menu Item",
    "Seasonal / Holiday Special",
    "Loyalty / VIP Message",
  ];
  const [linklist, setLinkList] = useState({ links: [] });
  const [days, setDays] = useState(
    Array.from({ length: TOTAL_DAYS }, (_, i) => ({
      local_id: i,
      mode: "manual",
      promotion: "",
      time: "",
      day_of_week: "",
      posted: false,
      link: "",
    }))
  );

  const handleModeChange = (dayIndex, newMode) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].mode = newMode;
    if (newMode !== "auto") {
      updatedDays[dayIndex].promotion = "";
    }
    setDays(updatedDays);
  };
  const handlelinkChange = (dayIndex, link) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].link = link;
    setDays(updatedDays);
  };

  const handlePromotionChange = (dayIndex, promotion) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].promotion = promotion;
    setDays(updatedDays);
  };

  const handleTimeChange = (dayIndex, time) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].time = time;
    setDays(updatedDays);
  };

  const handleDayOfWeekChange = (dayIndex, day_of_week) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].day_of_week = day_of_week;
    setDays(updatedDays);
  };

  const scheduledCount = days.filter((d) => d.mode === "auto").length;

  // const isDayValid = (day) =>
  //   day.mode !== "auto" ||
  //   (day.promotion && day.time && day.day_of_week && day.link);

  const isEmpty = (v) => v === "" || v === null || v === undefined;

  const isDayValid = (day) =>
    day.mode !== "auto" ||
    !(
      isEmpty(day.promotion) ||
      isEmpty(day.time) ||
      isEmpty(day.day_of_week) ||
      isEmpty(day.link)
    );

  const handleSubmit = () => {
    const invalidDays = days.filter((day) => !isDayValid(day));

    if (invalidDays.length > 0) {
      alert("All Auto days must have every field selected.");
      return;
    }
    axios({
      method: "POST",
      url: `${props.url}/api/set_post_schedule`,
      withCredentials: true,
      data: {
        days: days,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        console.log("Schedule set successfully:", response.data);
        navigate("/menu");
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        console.log(error.response);
        // console.log(error.response.status);
        // console.log(error.response.headers);
      });
  };

  const get_schedule = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_schedule`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
      .then((response) => {
        console.log("Current Schedule:", response.data);

        if (response.data.schedule && response.data.schedule.length > 0) {
          setDays(response.data.schedule);
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

  const getLinkList = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_tracked_links`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setLinkList(response.data);
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
  };
  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    get_schedule();
    getLinkList();
  }, [authReady, token]);

  return (
    <>
      {/* <TopBanner /> */}
      <Sidebar />
      <Box
        sx={{
          // ml: { md: "240px" }, // offset for permanent drawer

          width: "100%",
          minWidth: 0, // IMPORTANT for flex/shrink issues
          height: "100vh",
          p: 4,
        }}
      >
        <PostCalendar links={linklist.links} url={props.url} />
      </Box>
    </>
  );
}

{
  /*

  <Box p={4}>
        <Typography variant="h5" gutterBottom>
          Days Scheduled
        </Typography>
        <Grid container spacing={2}>
          {days.map((day, index) => (
            <Grid item xs={12} sm={6} md={4} key={index} alignItems="stretch">
              <Card
                sx={{
                  maxWidth: 345,
                  margin: "auto",
                  height: "100%",
                  opacity: day.posted ? 0.5 : 1,
                  backgroundColor: day.posted ? "grey.100" : "background.paper",
                  pointerEvents: day.posted ? "none" : "auto",
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Promotion {index + 1}
                  </Typography>


                  <ToggleButtonGroup
                    value={day.mode}
                    exclusive
                    onChange={(e, value) =>
                      value && handleModeChange(index, value)
                    }
                    aria-label="mode selection"
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    <ToggleButton value="auto">Auto</ToggleButton>
                    <ToggleButton value="manual">Manual</ToggleButton>
                  </ToggleButtonGroup>


                  {day.mode === "auto" && (
                    <>
                      <FormControl
                        fullWidth
                        size="small"
                        error={hasError(day, day.promotion)}
                      >
                        <Select
                          value={day.promotion}
                          onChange={(e) =>
                            handlePromotionChange(index, e.target.value)
                          }
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Promotion
                          </MenuItem>
                          {promotion.map((item) => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl
                        fullWidth
                        size="small"
                        error={hasError(day, day.time)}
                      >
                        <Select
                          value={day.time}
                          onChange={(e) =>
                            handleTimeChange(index, e.target.value)
                          }
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Post Time
                          </MenuItem>
                          <MenuItem value="0">08:00 AM</MenuItem>
                          <MenuItem value="1">12:00 PM</MenuItem>
                          <MenuItem value="2">04:00 PM</MenuItem>
                          <MenuItem value="3">08:00 PM</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl
                        fullWidth
                        size="small"
                        error={hasError(day, day.day_of_week)}
                      >
                        <Select
                          value={day.day_of_week}
                          onChange={(e) =>
                            handleDayOfWeekChange(index, e.target.value)
                          }
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Day of Week
                          </MenuItem>
                          <MenuItem value="6">Sunday</MenuItem>
                          <MenuItem value="0">Monday</MenuItem>
                          <MenuItem value="1">Tuesday</MenuItem>
                          <MenuItem value="2">Wednesday</MenuItem>
                          <MenuItem value="3">Thursday</MenuItem>
                          <MenuItem value="4">Friday</MenuItem>
                          <MenuItem value="5">Saturday</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{ mt: 2 }}
                        error={hasError(day, day.link)}
                      >
                        <Select
                          value={day.link}
                          onChange={(e) =>
                            handlelinkChange(index, e.target.value)
                          }
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Link
                          </MenuItem>
                          {linklist.links.map((link) => (
                            <MenuItem key={link} value={link}>
                              {link}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Button onClick={handleSubmit}> Submit Schedule </Button>
        </Grid>
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
          handleSubmit={handlePostSubmit}
          url={props.url}
          loading={loading}
        />
      </Box>
  */
}
