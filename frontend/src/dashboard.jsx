import React, { useState } from "react";
import { Container, Fab, Typography, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PostEditor from "./PostEditor";
import PostList from "./PostList";
import Analytics from "./Analytics";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [openEditor, setOpenEditor] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    console.log("Post content:", content);
    console.log("Attached image:", image);
    axios({
      method: "POST",
      url: `/api/new_post`,
      data: {
        content: content,
        image: image,
        title: "New Post Title",
      },
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
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Analytics />
      <PostList />

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
      />
    </Container>
  );
}
