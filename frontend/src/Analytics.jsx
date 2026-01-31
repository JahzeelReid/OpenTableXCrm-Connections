import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "./authContext";

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { LineChart } from "@mui/x-charts/LineChart";

export default function Analytics(props) {
  const { token, authReady } = useContext(AuthContext);
  const [data, setData] = useState({
    labels: [
      "2025-11-10",
      "2025-11-17",
      "2025-11-24",
      "2025-12-01",
      "2025-12-08",
      "2025-12-15",
      "2025-12-22",
      "2025-12-29",
      "2026-01-05",
      "2026-01-12",
      "2026-01-19",
      "2026-01-26",
    ],
    series: [
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        id: 1,
        name: "Youtube.com",
      },
    ],
  });
  const [selectedRange, setSelectedRange] = useState("today");

  const { labels, series } = data;

  // Convert series into a dataset MUI expects
  // Convert to MUI dataset format: [{ xKey: label, series1: value1, series2: value2, ... }, ...]
  const dataset = labels.map((label, i) => {
    const row = { x: label };
    series.forEach((s) => {
      row[s.name] = s.data[i];
    });
    return row;
  });

  // MUI series config
  const muiSeries = series.map((s) => ({
    dataKey: s.name,
    label: s.name,
    // showMark: true,
    showMark: false,
    curve: "bumpX",
    // optional: color: '#FF0000' // you can assign a color per link if you want
  }));

  function getdata() {
    axios({
      method: "POST",
      url: `${props.url}/api/todays_clicks_timeseries`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { range: selectedRange },
      withCredentials: true,
    })
      .then((response) => {
        // Handle the response data
        setData(response.data);
        console.log(response.data);
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
  }

  useEffect(() => {
    if (!authReady) return; //  wait
    if (!token) return; // not logged in
    getdata();
  }, [authReady, token, selectedRange]);

  return (
    <Card
      sx={{
        mb: 3,
        border: "1px solid rgba(255,255,255,0.05)", // Subtle definition
        boxShadow: `
                      0 1px 0 rgba(255,255,255,0.06),
                      0 14px 10px rgba(0,0,0,0.75)`,

        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `
                      0 1px 0 rgba(255,255,255,0.08),
                      0 20px 25px rgba(0,0,0,0.85)
                    `,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <Select
            label="Range"
            value={selectedRange}
            onChange={(e) => {
              setSelectedRange(e.target.value);
            }}
          >
            <MenuItem value={"today"}>Today</MenuItem>
            <MenuItem value={"week"}>Last 7 Days</MenuItem>
            <MenuItem value={"month"}>Last 3 Months</MenuItem>
          </Select>
          <Typography variant="h6" gutterBottom>
            Analytics Overview
          </Typography>
        </Stack>

        {/* <ResponsiveContainer width="100%" height={250}> */}
        <LineChart
          height={400}
          width={600}
          dataset={dataset}
          series={muiSeries}
          xAxis={[
            { dataKey: "x", scaleType: "band", valueFormatter: (v) => v },
          ]}
          yAxis={[{ width: 60 }]}
        />
        {/* </ResponsiveContainer> */}
      </CardContent>
    </Card>
  );
}
//trying to give the welcome, the review,
//for the review make a copy of review site
//send a review request if they take 3 or less stars save and do nothing
//if 5 send to google review page
//higher people for dashboard an onboarding
//Have ai create the text messages regarding promotion
//recycle content by creating templates that allow the parameters to be mixed an matched to the users
//I'm working on:
// create and flesh out the client portal to include
// templates for users to select from and reccomendations from ai
// work on sending those chosen templates to go highe level to
// research api to see if we can send text to go high level that can be
// sent to cantacts via text message
// can either be a dish or a reservation promotion
// track clicks on link via utm parameters
//dashboard snapshot of analytics

// can we use utms to track clicks on links sent via text message
//
// research go high level api to see if we can send text messages via their platform
// research ai text generation for promotional messages
// track number of clicks, number of reservations, revenue,
//
// reservation vs promotion vs menu item advertisement
// 3
