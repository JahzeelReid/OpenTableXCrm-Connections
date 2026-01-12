import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import React, { useEffect, useState, useContext } from "react";
import PostModal from "./Modal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "./authContext";

export default function PostCalendar(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const { token, authReady } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([
    {
      id: 9,
      title: "Instagram Post",
      start: "2026-02-10T09:00:00",
      extendedProps: {
        content: "New menu drops today 🍔",
        platform: "instagram",
        status: "scheduled",
      },
    },
    {
      id: 10,
      title: "Instagram • Daily Special",
      start: "2026-01-07T14:30:00",
      extendedProps: {
        content: "Today’s special: garlic chicken ramen 🍜",
        platform: "instagram",
        status: "scheduled", // or "posted" if already published
        author: "Marketing Team",
        characterCount: 44,
        internalNotes: "Post during lunch rush",
      },
    },
  ]);

  const get_calendar_posts = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_calendar_events`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
      .then((response) => {
        // Append new posts to existing posts

        setPosts(response.data.events);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
      });
  };

  useEffect(() => {
    get_calendar_posts();
  }, []);

  return (
    <>
      <FullCalendar
        timeZone="local"
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="100%"
        selectable
        editable
        events={posts}
        select={(info) => {
          setSelectedDate(info.start);
          setSelectedPost(null); // creating, not editing
          setModalOpen(true);
        }}
        eventClick={(info) => {
          setSelectedPost({
            id: info.event.id,
            title: info.event.title, // include title
            start: info.event.start, // include start date
            end: info.event.end, // optional, if your events have an end
            extendedProps: info.event.extendedProps, // keep all extended props intact
          });
          setSelectedDate(info.start);
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
        onSave={(postData) => {
          console.log("Save post:", postData);
          // call API here
        }}
        links={props.links}
        url={props.url}
      />
    </>
  );
}
