import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ClientPortal() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Mock data for demo
    setPosts([
      { content: "<p>Welcome to your first post!</p>", image: null },
      { content: "<p>Analytics look great this week.</p>", image: null },
    ]);
  }, []);

  const handleSubmit = () => {
    const newPost = {
      content,
      image: image ? URL.createObjectURL(image) : null,
    };
    setPosts([newPost, ...posts]);
    setContent("");
    setImage(null);
    setOpen(false);
  };

  const data = [
    { name: "Views", value: 2400 },
    { name: "Clicks", value: 1398 },
    { name: "Shares", value: 800 },
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Client Dashboard
      </Typography>

      {/* Analytics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Analytics Overview</Typography>
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

      {/* Posts */}
      <Typography variant="h5" gutterBottom>
        Previous Posts
      </Typography>
      {posts.map((post, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Typography dangerouslySetInnerHTML={{ __html: post.content }} />
            {post.image && (
              <img
                src={post.image}
                alt="Post"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  borderRadius: "8px",
                }}
              />
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add Post Button */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 30, right: 30 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Post Editor */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <ReactQuill value={content} onChange={setContent} />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ marginTop: "1rem" }}
          />
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
            Submit Post
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
