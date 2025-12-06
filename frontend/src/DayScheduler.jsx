import React, { useState } from "react";
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
} from "@mui/material";

const TOTAL_DAYS = 12;

export default function DayScheduler() {
  const navigate = useNavigate();
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
  const [days, setDays] = useState(
    Array.from({ length: TOTAL_DAYS }, () => ({
      mode: "manual",
      promotion: "",
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

  const handlePromotionChange = (dayIndex, promotion) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].promotion = promotion;
    setDays(updatedDays);
  };

  const scheduledCount = days.filter((d) => d.mode === "auto").length;

  const handleSubmit = () => {
    axios({
      method: "POST",
      url: `/api/set_post_schedule`,
      data: {
        days: days,
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

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        Days Scheduled
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(scheduledCount / TOTAL_DAYS) * 100}
        sx={{ mb: 4, height: 10, borderRadius: 5 }}
      />
      <Grid container spacing={2}>
        {days.map((day, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Promotion {index + 1}
                </Typography>

                {/* Auto / Manual Radial Menu */}
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

                {/* Promotion Radial Menu (if Auto is selected) */}
                {day.mode === "auto" && (
                  <FormControl fullWidth size="small">
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
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Button onClick={handleSubmit}> Submit Schedule </Button>
      </Grid>
    </Box>
  );
}
