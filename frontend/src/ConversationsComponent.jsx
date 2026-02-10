import React, { useEffect, useState, useContext, useRef } from "react";
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ForumIcon from "@mui/icons-material/Forum";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./authContext";

export default function ConversationsPage(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);

  // State
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [showChatMobile, setShowChatMobile] = useState(false); // Mobile navigation toggle

  const messagesEndRef = useRef(null);
  const activeConversation = conversations.find((c) => c.id === activeId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation, showChatMobile]);

  const getConvo = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_all_convos`,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        setConversations(response.data.conversations);
        if (response.data.conversations.length > 0 && !activeId) {
          setActiveId(response.data.conversations[0].id);
        }
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      });
  };

  const submitMsg = () => {
    if (!messageInput.trim()) return;
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
      .then(() => {
        setMessageInput("");
        getConvo();
      })
      .catch((error) => {
        console.error("Error sending message", error);
      });
  };

  useEffect(() => {
    if (authReady && token) getConvo();
  }, [authReady, token]);

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#0f0f0f",
        color: "#fff",
        p: isMobile ? 0 : 3, // Full screen on mobile
        display: "flex",
        gap: isMobile ? 0 : 2,
      }}
    >
      {/* --- SIDEBAR (CONVERSATION LIST) --- */}
      <Paper
        sx={{
          width: isMobile ? "100%" : 320,
          display: isMobile && showChatMobile ? "none" : "flex",
          flexDirection: "column",
          bgcolor: "#151515",
          borderRadius: isMobile ? 0 : 3,
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <ForumIcon sx={{ color: "#c9a45c" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
        <List sx={{ flex: 1, overflowY: "auto", py: 0 }}>
          {conversations.map((c) => (
            <React.Fragment key={c.id}>
              <ListItem
                button
                selected={c.id === activeId}
                onClick={() => {
                  setActiveId(c.id);
                  if (isMobile) setShowChatMobile(true);
                }}
                sx={{
                  py: 2,
                  "&.Mui-selected": {
                    bgcolor: "rgba(201, 164, 92, 0.08)",
                    "&:hover": { bgcolor: "rgba(201, 164, 92, 0.12)" },
                  },
                }}
              >
                <ListItemText
                  primary={c.name}
                  secondary={c.preview}
                  primaryTypographyProps={{
                    fontWeight: c.id === activeId ? 700 : 400,
                    color: "#fff",
                  }}
                  secondaryTypographyProps={{
                    color: "#888",
                    noWrap: true,
                    fontSize: "0.8rem",
                  }}
                />

                <Typography variant="caption" sx={{ color: "#555", ml: 1 }}>
                  {new Date(c.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </ListItem>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mx: 2 }} />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* --- CHAT PANEL --- */}
      <Paper
        sx={{
          flex: 1,
          display: isMobile && !showChatMobile ? "none" : "flex",
          bgcolor: "#151515",
          borderRadius: isMobile ? 0 : 3,
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            bgcolor: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {isMobile && (
            <IconButton
              onClick={() => setShowChatMobile(false)}
              sx={{ color: "#c9a45c", mr: 1 }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {activeConversation?.name || "Select a conversation"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#4caf50" }}>
              Online
            </Typography>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #1a1a1a 0%, #151515 100%)",
          }}
        >
          {activeConversation?.messages?.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "me" ? "flex-end" : "flex-start",
                mb: 1, // Restores your tight vertical spacing
                "&:hover .message-time": { display: "block" }, // Renders it on hover
              }}
            >
              <Box
                sx={{
                  alignSelf: msg.sender === "me" ? "flex-end" : "flex-start",
                  bgcolor: msg.sender === "me" ? "#c9a45c" : "#2a2a2a",
                  color: msg.sender === "me" ? "#000" : "#fff",
                  p: 1.5,
                  px: 2,
                  borderRadius:
                    msg.sender === "me"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                  maxWidth: isMobile ? "85%" : "70%",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Box>

              <Typography
                className="message-time"
                variant="caption"
                sx={{
                  display: "none", // Completely unrendered by default
                  color: "#888",
                  mt: 0.5,
                  mx: 1,
                  fontSize: "0.7rem",
                }}
              >
                {new Date(msg.time).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            {!isMobile && (
              <IconButton sx={{ color: "#888" }}>
                <AttachFileIcon />
              </IconButton>
            )}

            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type a message..."
                variant="standard"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    color: "#fff",
                    bgcolor: "#252525",
                    borderRadius: "12px",
                    px: 2,
                    py: 1,
                  },
                }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={submitMsg}
              sx={{
                bgcolor: "#c9a45c",
                color: "#000",
                fontWeight: 600,
                borderRadius: "12px",
                height: "45px",
                "&:hover": { bgcolor: "#b38f4d" },
              }}
            >
              Send
            </Button>
          </Stack>

          <Stack direction="row" sx={{ mt: 1 }}>
            <Button
              size="small"
              endIcon={<ArrowDropDownIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ color: "#c9a45c", textTransform: "none" }}
            >
              Personalize
            </Button>
          </Stack>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { bgcolor: "#2a2a2a", color: "#fff" } }}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>Customer Name</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Booking Time</MenuItem>
        </Menu>
      </Paper>
    </Box>
  );
}

// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   List,
//   ListItem,
//   ListItemText,
//   Typography,
//   TextField,
//   Button,
//   Divider,
//   IconButton,
//   Menu,
//   MenuItem,
//   Stack,
//   Paper,
// } from "@mui/material";
// import AttachFileIcon from "@mui/icons-material/AttachFile";
// import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
// import { useContext } from "react";
// import { AuthContext } from "./authContext";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function ConversationsPage(props) {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [conversations, setConversations] = useState([
//     {
//       id: 2,
//       name: "Cody Fiscer",
//       preview: "Teulon: sial these whist ltes",
//       time: "1:44 PM",
//       messages: [
//         { id: 1, text: "Teulon: sial these whist ltes", sender: "them" },
//       ],
//     },
//     {
//       id: "QSXLHilCkgBvB1lKAbGZ",
//       // contact_id:
//       messages: [
//         {
//           id: 1,
//           text: "Hello, your table is ready wheree you at me.",
//           sender: "them",
//         },
//         { id: 2, text: "Oh nice, we're like 2 minutes away.", sender: "me" },
//         { id: 3, text: "Perfect, I’ll hold it for you.", sender: "them" },
//         { id: 4, text: "Appreciate it 🙏", sender: "me" },
//         {
//           id: 5,
//           text: "No worries, just checking—parking okay?",
//           sender: "them",
//         },
//         {
//           id: 6,
//           text: "Yeah, we found a spot around the corner.",
//           sender: "me",
//         },
//         {
//           id: 7,
//           text: "Great, host stand is right when you walk in.",
//           sender: "them",
//         },
//         { id: 8, text: "Got it, thanks!", sender: "me" },
//         {
//           id: 9,
//           text: "Also heads up, kitchen closes in about 45 mins.",
//           sender: "them",
//         },
//         { id: 10, text: "Good to know, we’ll order quick.", sender: "me" },
//         { id: 11, text: "Sounds good 👍", sender: "them" },
//         {
//           id: 12,
//           text: "Do you still have the special tonight?",
//           sender: "me",
//         },
//         {
//           id: 13,
//           text: "Yep, salmon risotto is still available.",
//           sender: "them",
//         },
//         { id: 14, text: "Nice, my partner will be happy lol", sender: "me" },
//         { id: 15, text: "Haha it’s been popular tonight.", sender: "them" },
//         { id: 16, text: "Walking in now.", sender: "me" },
//         { id: 17, text: "Perfect, I see you.", sender: "them" },
//         { id: 18, text: "That was fast 😄", sender: "me" },
//         { id: 19, text: "We try haha. Follow me.", sender: "them" },
//         { id: 20, text: "Table looks great.", sender: "me" },
//         {
//           id: 21,
//           text: "Glad you like it! Server will be right over.",
//           sender: "them",
//         },
//         { id: 22, text: "Awesome, thanks again.", sender: "me" },
//         { id: 23, text: "Any allergies I should note?", sender: "them" },
//         { id: 24, text: "Nope, all good.", sender: "me" },
//         { id: 25, text: "Cool, enjoy your night!", sender: "them" },
//         { id: 26, text: "Will do!", sender: "me" },
//         { id: 27, text: "Let me know if you need anything.", sender: "them" },
//         {
//           id: 28,
//           text: "Actually, could we get water when you get a chance?",
//           sender: "me",
//         },
//         { id: 29, text: "Absolutely, coming right up.", sender: "them" },
//         { id: 30, text: "Thanks!", sender: "me" },
//       ],
//       name: "(718) 216-8670",
//       preview:
//         "Welcome to Bamboo Walk Caribbean Restaurant! We made something special for you. Click the link to watch the video. We also have a gift for you at the end of the video.",
//       time: "Test",
//     },
//   ]);
//   // const [activeId, setActiveId] = useState(conversations[0].id);
//   const [activeId, setActiveId] = useState(null);

//   const [messageInput, setMessageInput] = useState("");
//   const navigate = useNavigate();

//   const activeConversation = conversations.find((c) => c.id === activeId);

//   const messagesEndRef = React.useRef(null);
//   const { token, authReady } = useContext(AuthContext);

//   React.useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [activeConversation]);

//   const getConvo = () => {
//     axios({
//       method: "GET",
//       url: `${props.url}/api/get_all_convos`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     })
//       .then((response) => {
//         setConversations(response.data.conversations);
//       })
//       .catch((error) => {
//         if (error.response && error.response.status === 401) {
//           console.warn("Session expired or invalid token.");
//           localStorage.removeItem("token"); // optional: clear stored token
//           navigate("/");
//         }
//         console.log(error.response);
//         console.log(error.response.status);
//         console.log(error.response.headers);
//       });
//   };

//   const submitMsg = () => {
//     axios({
//       method: "POST",
//       url: `${props.url}/api/manual_message`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       data: {
//         contact_id: activeConversation.contact_id,
//         message: messageInput,
//       },
//     })
//       .then((response) => {
//         alert("Message sent!");
//         getConvo();
//       })
//       .catch((error) => {
//         if (error.response && error.response.status === 401) {
//           console.warn("Session expired or invalid token.");
//           localStorage.removeItem("token"); // optional: clear stored token
//           navigate("/");
//         }
//         console.log(error.response);
//         console.log(error.response.status);
//         console.log(error.response.headers);
//       });
//   };

//   useEffect(() => {
//     if (!authReady) return;
//     if (!token) return;
//     getConvo();
//   }, [authReady, token]);

//   useEffect(() => {
//     if (conversations.length && !activeId) {
//       setActiveId(conversations[0].id);
//     }
//   }, [conversations]);

//   return (
//     <Box
//       sx={{
//         height: "100vh",
//         bgcolor: "#0f0f0f",
//         color: "#fff",
//         p: 3,
//         display: "flex",
//         gap: 2,
//       }}
//     >
//       {/* Sidebar */}
//       <Paper
//         sx={{
//           width: 280,
//           bgcolor: "#151515",
//           borderRadius: 3,
//           overflow: "hidden",
//         }}
//       >
//         <Typography variant="h6" sx={{ p: 2 }}>
//           Conversations
//         </Typography>
//         <Divider />
//         <List>
//           {conversations.map((c) => (
//             <ListItem
//               key={c.id}
//               button
//               selected={c.id === activeId}
//               onClick={() => setActiveId(c.id)}
//             >
//               <ListItemText
//                 primary={c.name}
//                 secondary={c.preview}
//                 primaryTypographyProps={{ color: "#fff" }}
//                 secondaryTypographyProps={{ color: "#aaa", noWrap: true }}
//               />
//               <Typography variant="caption" color="#888">
//                 {c.time}
//               </Typography>
//             </ListItem>
//           ))}
//         </List>
//       </Paper>

//       {/* Chat Panel */}
//       <Paper
//         sx={{
//           flex: 1,
//           bgcolor: "#151515",
//           borderRadius: 3,
//           display: "flex",
//           flexDirection: "column",
//           p: 2,
//         }}
//       >
//         {/* Messages (scrollable) */}
//         <Box
//           sx={{
//             flex: 1,
//             overflowY: "auto",
//             display: "flex",
//             flexDirection: "column",
//             gap: 2,
//             pr: 1,
//           }}
//         >
//           {/* {activeConversation.messages.map((msg) => ( */}
//           {activeConversation?.messages?.map((msg) => (
//             <Box
//               key={msg.id}
//               sx={{
//                 alignSelf: msg.sender === "me" ? "flex-end" : "flex-start",
//                 bgcolor: msg.sender === "me" ? "#2a2a2a" : "#1e1e1e",
//                 p: 2,
//                 borderRadius: 2,
//                 maxWidth: "70%",
//               }}
//             >
//               {msg.text}
//             </Box>
//           ))}
//           <div ref={messagesEndRef} />
//         </Box>

//         {/* Input */}
//         <Divider sx={{ my: 2 }} />
//         <Stack direction="row" spacing={1} alignItems="center">
//           <IconButton color="inherit">
//             <AttachFileIcon />
//           </IconButton>

//           <Button
//             variant="outlined"
//             endIcon={<ArrowDropDownIcon />}
//             onClick={(e) => setAnchorEl(e.currentTarget)}
//             sx={{ color: "#fff", borderColor: "#333" }}
//           >
//             Personalize
//           </Button>

//           <Menu
//             anchorEl={anchorEl}
//             open={Boolean(anchorEl)}
//             onClose={() => setAnchorEl(null)}
//           >
//             <MenuItem>Option 1</MenuItem>
//             <MenuItem>Option 2</MenuItem>
//           </Menu>

//           <TextField
//             fullWidth
//             placeholder="Type a message"
//             variant="outlined"
//             value={messageInput}
//             onChange={(e) => setMessageInput(e.target.value)}
//             InputProps={{ sx: { color: "#fff" } }}
//           />

//           <Button
//             variant="contained"
//             sx={{ bgcolor: "#c9a45c", color: "#000", px: 3 }}
//             onClick={submitMsg}
//           >
//             Send
//           </Button>
//         </Stack>
//       </Paper>
//     </Box>
//   );
// }
