import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Paper,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useContext } from "react";
import { AuthContext } from "./authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ConversationsPage(props) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [conversations, setConversations] = useState([
    {
      id: 2,
      name: "Cody Fiscer",
      preview: "Teulon: sial these whist ltes",
      time: "1:44 PM",
      messages: [
        { id: 1, text: "Teulon: sial these whist ltes", sender: "them" },
      ],
    },
    {
      id: "QSXLHilCkgBvB1lKAbGZ",
      // contact_id:
      messages: [
        {
          id: 1,
          text: "Hello, your table is ready wheree you at me.",
          sender: "them",
        },
        { id: 2, text: "Oh nice, we're like 2 minutes away.", sender: "me" },
        { id: 3, text: "Perfect, I’ll hold it for you.", sender: "them" },
        { id: 4, text: "Appreciate it 🙏", sender: "me" },
        {
          id: 5,
          text: "No worries, just checking—parking okay?",
          sender: "them",
        },
        {
          id: 6,
          text: "Yeah, we found a spot around the corner.",
          sender: "me",
        },
        {
          id: 7,
          text: "Great, host stand is right when you walk in.",
          sender: "them",
        },
        { id: 8, text: "Got it, thanks!", sender: "me" },
        {
          id: 9,
          text: "Also heads up, kitchen closes in about 45 mins.",
          sender: "them",
        },
        { id: 10, text: "Good to know, we’ll order quick.", sender: "me" },
        { id: 11, text: "Sounds good 👍", sender: "them" },
        {
          id: 12,
          text: "Do you still have the special tonight?",
          sender: "me",
        },
        {
          id: 13,
          text: "Yep, salmon risotto is still available.",
          sender: "them",
        },
        { id: 14, text: "Nice, my partner will be happy lol", sender: "me" },
        { id: 15, text: "Haha it’s been popular tonight.", sender: "them" },
        { id: 16, text: "Walking in now.", sender: "me" },
        { id: 17, text: "Perfect, I see you.", sender: "them" },
        { id: 18, text: "That was fast 😄", sender: "me" },
        { id: 19, text: "We try haha. Follow me.", sender: "them" },
        { id: 20, text: "Table looks great.", sender: "me" },
        {
          id: 21,
          text: "Glad you like it! Server will be right over.",
          sender: "them",
        },
        { id: 22, text: "Awesome, thanks again.", sender: "me" },
        { id: 23, text: "Any allergies I should note?", sender: "them" },
        { id: 24, text: "Nope, all good.", sender: "me" },
        { id: 25, text: "Cool, enjoy your night!", sender: "them" },
        { id: 26, text: "Will do!", sender: "me" },
        { id: 27, text: "Let me know if you need anything.", sender: "them" },
        {
          id: 28,
          text: "Actually, could we get water when you get a chance?",
          sender: "me",
        },
        { id: 29, text: "Absolutely, coming right up.", sender: "them" },
        { id: 30, text: "Thanks!", sender: "me" },
      ],
      name: "(718) 216-8670",
      preview:
        "Welcome to Bamboo Walk Caribbean Restaurant! We made something special for you. Click the link to watch the video. We also have a gift for you at the end of the video.",
      time: "Test",
    },
  ]);
  // const [activeId, setActiveId] = useState(conversations[0].id);
  const [activeId, setActiveId] = useState(null);

  const [messageInput, setMessageInput] = useState("");
  const navigate = useNavigate();

  const activeConversation = conversations.find((c) => c.id === activeId);

  const messagesEndRef = React.useRef(null);
  const { token, authReady } = useContext(AuthContext);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  const getConvo = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_all_convos`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setConversations(response.data.conversations);
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

  const submitMsg = () => {
    axios({
      method: "POST",
      url: `${props.url}/api/manual_message`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        contact_id: activeConversation.contact_id,
        message: messageInput,
      },
    })
      .then((response) => {
        alert("Message sent!");
        getConvo();
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
    getConvo();
  }, [authReady, token]);

  useEffect(() => {
    if (conversations.length && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations]);

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#0f0f0f",
        color: "#fff",
        p: 3,
        display: "flex",
        gap: 2,
      }}
    >
      {/* Sidebar */}
      <Paper
        sx={{
          width: 280,
          bgcolor: "#151515",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>
          Conversations
        </Typography>
        <Divider />
        <List>
          {conversations.map((c) => (
            <ListItem
              key={c.id}
              button
              selected={c.id === activeId}
              onClick={() => setActiveId(c.id)}
            >
              <ListItemText
                primary={c.name}
                secondary={c.preview}
                primaryTypographyProps={{ color: "#fff" }}
                secondaryTypographyProps={{ color: "#aaa", noWrap: true }}
              />
              <Typography variant="caption" color="#888">
                {c.time}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Chat Panel */}
      <Paper
        sx={{
          flex: 1,
          bgcolor: "#151515",
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          p: 2,
        }}
      >
        {/* Messages (scrollable) */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pr: 1,
          }}
        >
          {/* {activeConversation.messages.map((msg) => ( */}
          {activeConversation?.messages?.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                alignSelf: msg.sender === "me" ? "flex-end" : "flex-start",
                bgcolor: msg.sender === "me" ? "#2a2a2a" : "#1e1e1e",
                p: 2,
                borderRadius: 2,
                maxWidth: "70%",
              }}
            >
              {msg.text}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton color="inherit">
            <AttachFileIcon />
          </IconButton>

          <Button
            variant="outlined"
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: "#fff", borderColor: "#333" }}
          >
            Personalize
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem>Option 1</MenuItem>
            <MenuItem>Option 2</MenuItem>
          </Menu>

          <TextField
            fullWidth
            placeholder="Type a message"
            variant="outlined"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            InputProps={{ sx: { color: "#fff" } }}
          />

          <Button
            variant="contained"
            sx={{ bgcolor: "#c9a45c", color: "#000", px: 3 }}
            onClick={submitMsg}
          >
            Send
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
