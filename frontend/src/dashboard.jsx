import React, { useEffect, useState } from "react";
import { Container, Fab, Typography, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PostEditor from "./Posteditor";
import PostList from "./Postlist";
import Analytics from "./Analytics";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./authContext";

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

  const handleSubmit = () => {
    console.log("Post content:", content);
    console.log("Attached image:", image);

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
  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    check_company_state();
  }, [authReady, token]);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Analytics url={props.url} />
      <PostList url={props.url} />

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
      />
    </Container>
  );
}
