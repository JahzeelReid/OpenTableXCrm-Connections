import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddLinkIcon from "@mui/icons-material/AddLink";
import LinkIcon from "@mui/icons-material/Link";
import axios from "axios";
import { AuthContext } from "./authContext";
import Sidebar from "./sidebar";

export default function LinkUploader(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);
  const [linklist, setLinkList] = useState({ links: [] });

  // Sync sidebar width
  const mainContentShift = isMobile ? 0 : "240px";

  const getLinkList = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_tracked_links`,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => setLinkList(response.data))
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      });
  };

  const submitLinks = () => {
    axios({
      method: "POST",
      url: `${props.url}/api/create_tracked_link`,
      headers: { Authorization: `Bearer ${token}` },
      data: linklist,
    })
      .then(() => alert("Links saved successfully!"))
      .catch((error) => error.response?.status === 401 && navigate("/"));
  };

  const updateLink = (index, value) => {
    const updated = [...linklist.links];
    updated[index] = value;
    setLinkList({ links: updated });
  };

  const deleteLink = (index) => {
    const updated = linklist.links.filter((_, i) => i !== index);
    setLinkList({ links: updated });
  };

  const addLink = () => {
    setLinkList((prev) => ({
      links: [...prev.links, ""],
    }));
  };

  useEffect(() => {
    if (authReady && token) getLinkList();
  }, [authReady, token]);

  return (
    <Box sx={{ display: "flex", bgcolor: "#0f0f0f", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: mainContentShift,
          p: isMobile ? 2 : 4,
          width: isMobile ? "100%" : `calc(100% - 240px)`,
        }}
      >
        <Box sx={{ maxWidth: 800, margin: "0 auto" }}>
          <Typography
            variant="h4"
            sx={{ color: "#e6c37a", mb: 4, fontWeight: 700 }}
          >
            Tracked Links
          </Typography>

          <Paper
            sx={{
              p: isMobile ? 2 : 4,
              bgcolor: "#151515",
              borderRadius: 4,
              border: "1px solid rgba(255, 215, 160, 0.08)",
              boxShadow: "0 14px 28px rgba(0,0,0,0.5)",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinkIcon sx={{ color: "#c9a45c" }} />
                <Typography variant="h6" sx={{ color: "#fff" }}>
                  Marketing URL List
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddLinkIcon />}
                onClick={addLink}
                sx={{
                  color: "#c9a45c",
                  borderColor: "rgba(201, 164, 92, 0.5)",
                  "&:hover": {
                    borderColor: "#c9a45c",
                    bgcolor: "rgba(201, 164, 92, 0.05)",
                  },
                }}
              >
                Add Link
              </Button>
            </Stack>

            <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.05)" }} />

            <Stack spacing={2}>
              {linklist?.links?.map((link, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "rgba(255,255,255,0.02)",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="https://example.com/promo"
                    value={link}
                    onChange={(e) => updateLink(i, e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      sx: { color: "#fff", px: 1 },
                    }}
                  />
                  <IconButton
                    onClick={() => deleteLink(i)}
                    sx={{
                      color: "#ff4444",
                      "&:hover": { bgcolor: "rgba(255, 68, 68, 0.1)" },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              {linklist?.links?.length === 0 && (
                <Typography sx={{ color: "#555", textAlign: "center", py: 4 }}>
                  No tracked links found. Click "Add Link" to begin.
                </Typography>
              )}
            </Stack>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={submitLinks}
              disabled={!linklist.links?.length}
              sx={{
                mt: 6,
                bgcolor: "#c9a45c",
                color: "#000",
                fontWeight: 700,
                py: 1.5,
                "&:hover": { bgcolor: "#b38f4d" },
                "&:disabled": { bgcolor: "#333", color: "#666" },
              }}
            >
              Save Tracked Links
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

// import { useNavigate } from "react-router-dom";
// import React, { useCallback, useEffect, useState } from "react";
// import { useDropzone } from "react-dropzone";
// import { Box, Typography, Button } from "@mui/material";
// import axios from "axios";
// import { useContext } from "react";
// import { AuthContext } from "./authContext";

// import Sidebar from "./sidebar";

// export default function LinkUploader(props) {
//   const [files, setFiles] = useState([]);
//   const { token, authReady } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [menuItems, setMenuItems] = useState();
//   const [loading, setLoading] = useState(false);
//   const [linklist, setLinkList] = useState({ links: [] });

//   const submitLinks = () => {
//     axios({
//       method: "POST",
//       url: `${props.url}/api/create_tracked_link`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       data: linklist,
//     })
//       .then((response) => {
//         console.log("Links Submitted:", response.data);
//         alert("Links saved! (functionality to be implemented)");
//         // navigate("/dashboard");
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

//   const getLinkList = () => {
//     axios({
//       method: "GET",
//       url: `${props.url}/api/get_tracked_links`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     })
//       .then((response) => {
//         setLinkList(response.data);
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
//     getLinkList();
//   }, [authReady, token]);

//   return (
//     <>
//       <Sidebar />
//       <Box>
//         {linklist?.links && (
//           <Box sx={{ mt: 4 }}>
//             <Typography variant="h6" gutterBottom>
//               Menu Items
//             </Typography>
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr>
//                   <th
//                     style={{
//                       borderBottom: "1px solid #ccc",
//                       padding: "0.5rem",
//                     }}
//                   >
//                     Link
//                   </th>

//                   <th
//                     style={{
//                       borderBottom: "1px solid #ccc",
//                       padding: "0.5rem",
//                     }}
//                   >
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {linklist.links.map((link, i) => (
//                   <tr key={i}>
//                     <td
//                       style={{
//                         borderBottom: "1px solid #eee",
//                         padding: "0.5rem",
//                       }}
//                     >
//                       <input
//                         value={link}
//                         onChange={(e) => {
//                           const updated = linklist.links.map((item, idx) =>
//                             idx === i ? e.target.value : item
//                           );

//                           setLinkList({ links: updated });
//                         }}
//                         style={{ width: "100%" }}
//                       />
//                     </td>

//                     <td
//                       style={{
//                         borderBottom: "1px solid #eee",
//                         padding: "0.5rem",
//                       }}
//                     >
//                       <button
//                         onClick={() => {
//                           const updated = linklist.links.filter(
//                             (_, idx) => idx !== i
//                           );
//                           setLinkList({ links: updated });
//                         }}
//                         style={{
//                           background: "red",
//                           color: "white",
//                           border: "none",
//                           padding: "6px 10px",
//                           borderRadius: "6px",
//                           cursor: "pointer",
//                         }}
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//                 <tr>
//                   <td colSpan="3" style={{ padding: "1rem 0" }}>
//                     <button
//                       onClick={() => {
//                         setLinkList((prev) => ({
//                           links: [...prev.links, ""],
//                         }));
//                       }}
//                       style={{
//                         marginTop: "12px",
//                         background: "#1976d2",
//                         color: "white",
//                         border: "none",
//                         padding: "8px 14px",
//                         borderRadius: "6px",
//                         cursor: "pointer",
//                       }}
//                     >
//                       + Add Link
//                     </button>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </Box>
//         )}

//         <Button
//           variant="contained"
//           color="success"
//           sx={{ mt: 2 }}
//           onClick={submitLinks}
//           disabled={!linklist.links || linklist.links.length === 0}
//         >
//           Save Links
//         </Button>
//       </Box>
//     </>
//   );
// }
