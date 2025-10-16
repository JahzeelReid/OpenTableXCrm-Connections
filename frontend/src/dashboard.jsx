import React, { useState } from "react";
import { Container, Fab, Typography, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PostEditor from "./PostEditor";
import PostList from "./PostList";
import Analytics from "./Analytics";

export default function Dashboard() {
  const [openEditor, setOpenEditor] = useState(false);

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

      <PostEditor open={openEditor} onClose={() => setOpenEditor(false)} />
    </Container>
  );
}
