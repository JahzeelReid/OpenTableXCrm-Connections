import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import React, { useEffect, useState, useContext } from "react";
import PostModal from "./Modal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "./authContext";
import { Box, useTheme, useMediaQuery } from "@mui/material";

export default function PostCalendar(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const { token, authReady } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [posts, setPosts] = useState([]);

  const get_calendar_posts = () => {
    if (!token) return;
    axios({
      method: "GET",
      url: `${props.url}/api/get_calendar_events`,
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    })
      .then((response) => {
        setPosts(response.data.events);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      });
  };

  useEffect(() => {
    get_calendar_posts();
  }, [modalOpen, authReady]);

  return (
    <Box
      sx={{
        height: isMobile ? "calc(100vh - 100px)" : "calc(100vh - 64px)",
        p: isMobile ? 1 : 3,
        bgcolor: "#0f0f0f",
        color: "#fff",
        // CSS OVERRIDES FOR FULLCALENDAR
        "& .fc": {
          "--fc-border-color": "rgba(255, 215, 160, 0.15)",
          "--fc-daygrid-event-dot-width": "8px",
          height: "100%",
          fontFamily: theme.typography.fontFamily,
        },
        // Toolbar button colors
        "& .fc .fc-button-primary": {
          bgcolor: "#c9a45c",
          borderColor: "#c9a45c",
          color: "#000",
          fontWeight: "bold",
          textTransform: "capitalize",
          "&:hover": { bgcolor: "#b38f4d", borderColor: "#b38f4d" },
          "&:disabled": {
            bgcolor: "rgba(201, 164, 92, 0.5)",
            borderColor: "transparent",
          },
        },
        // Header title
        "& .fc .fc-toolbar-title": {
          color: "#e6c37a",
          fontSize: isMobile ? "1.1rem" : "1.5rem",
        },
        // Day numbers and Weekday headers
        "& .fc .fc-col-header-cell-cushion, & .fc .fc-daygrid-day-number": {
          color: "#fff",
          textDecoration: "none !important",
          p: 1,
        },
        // Event styling (The fix for the blue text/bg)
        "& .fc-event": {
          bgcolor: "rgba(201, 164, 92, 0.2) !important",
          border: "1px solid #c9a45c !important",
          borderRadius: "4px",
          p: "2px 5px",
        },
        "& .fc-event-title": {
          color: "#e6c37a !important",
          fontWeight: 600,
          fontSize: "0.85rem",
        },
        // Today's highlight
        "& .fc .fc-day-today": {
          bgcolor: "rgba(255, 255, 255, 0.03) !important",
        },
      }}
    >
      <FullCalendar
        timeZone="local"
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
        headerToolbar={{
          left: isMobile ? "prev,next" : "prev,next today",
          center: "title",
          right: isMobile
            ? "dayGridMonth,timeGridDay"
            : "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        handleWindowResize={true}
        selectable
        editable
        events={posts}
        select={(info) => {
          setSelectedDate(info.start);
          setSelectedPost(null);
          setModalOpen(true);
        }}
        eventClick={(info) => {
          setSelectedPost({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            extendedProps: info.event.extendedProps,
          });
          setSelectedDate(info.event.start);
          setModalOpen(true);
        }}
      />

      <PostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        setSelectedPost={setSelectedPost}
        selectedPost={selectedPost}
        onSave={(postData) => console.log("Save post:", postData)}
        links={props.links}
        url={props.url}
      />
    </Box>
  );
}

// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import React, { useEffect, useState, useContext } from "react";
// import PostModal from "./Modal";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { AuthContext } from "./authContext";

// export default function PostCalendar(props) {
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedPost, setSelectedPost] = useState(null);
//   const { token, authReady } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [posts, setPosts] = useState([
//     {
//       id: 9,
//       title: "Instagram Post",
//       start: "2026-02-10T09:00:00",
//       extendedProps: {
//         content: "New menu drops today 🍔",
//         platform: "instagram",
//         status: "scheduled",
//       },
//     },
//     {
//       id: 10,
//       title: "Instagram • Daily Special",
//       start: "2026-01-07T14:30:00",
//       extendedProps: {
//         content: "Today’s special: garlic chicken ramen 🍜",
//         platform: "instagram",
//         status: "scheduled", // or "posted" if already published
//         author: "Marketing Team",
//         characterCount: 44,
//         internalNotes: "Post during lunch rush",
//       },
//     },
//   ]);

//   const get_calendar_posts = () => {
//     axios({
//       method: "GET",
//       url: `${props.url}/api/get_calendar_events`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       withCredentials: true,
//     })
//       .then((response) => {
//         // Append new posts to existing posts

//         setPosts(response.data.events);
//       })
//       .catch((error) => {
//         if (error.response && error.response.status === 401) {
//           console.warn("Session expired or invalid token.");
//           localStorage.removeItem("token"); // optional: clear stored token
//           navigate("/");
//         }
//       });
//   };

//   useEffect(() => {
//     get_calendar_posts();
//   }, [modalOpen]);

//   return (
//     <>
//       <FullCalendar
//         timeZone="local"
//         plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
//         initialView="dayGridMonth"
//         height="100%"
//         selectable
//         editable
//         events={posts}
//         select={(info) => {
//           setSelectedDate(info.start);
//           setSelectedPost(null); // creating, not editing
//           setModalOpen(true);
//         }}
//         eventClick={(info) => {
//           setSelectedPost({
//             id: info.event.id,
//             title: info.event.title, // include title
//             start: info.event.start, // include start date
//             end: info.event.end, // optional, if your events have an end
//             extendedProps: info.event.extendedProps, // keep all extended props intact
//           });
//           setSelectedDate(info.start);
//           setModalOpen(true);
//         }}
//       />
//       <PostModal
//         open={modalOpen}
//         onClose={() => setModalOpen(false)}
//         selectedDate={selectedDate}
//         setSelectedDate={setSelectedDate}
//         setSelectedPost={setSelectedPost}
//         selectedPost={selectedPost}
//         onSave={(postData) => {
//           console.log("Save post:", postData);
//           // call API here
//         }}
//         links={props.links}
//         url={props.url}
//       />
//     </>
//   );
// }
