import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Views", value: 2400 },
  { name: "Clicks", value: 1398 },
  { name: "Engagements", value: 9800 },
];

export default function Analytics() {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Analytics Overview
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
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
