import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useState, useContext } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Stack,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { AuthContext } from "./authContext";
import Sidebar from "./sidebar";

export default function MenuUploader(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);

  const [files, setFiles] = useState([]);
  const [menuItems, setMenuItems] = useState({ menu: { items: [] } });
  const [loading, setLoading] = useState(false);

  // Offset for the sidebar (240px is your drawerWidth)
  const mainContentShift = isMobile ? 0 : "240px";

  const getmenu = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_menu`,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setMenuItems(res.data))
      .catch((err) => err.response?.status === 401 && navigate("/"));
  };

  const updateItem = (index, field, value) => {
    const updated = [...menuItems.menu.items];
    updated[index][field] = value;
    setMenuItems({ menu: { items: updated } });
  };

  const deleteItem = (index) => {
    const updated = menuItems.menu.items.filter((_, i) => i !== index);
    setMenuItems({ menu: { items: updated } });
  };

  const addItem = () => {
    const updated = [...menuItems.menu.items, { name: "", price: "" }];
    setMenuItems({ menu: { items: updated } });
  };

  const onDrop = useCallback((acceptedFiles) => setFiles(acceptedFiles), []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
  });

  const uploadFile = async () => {
    if (files.length === 0) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", files[0]);

    axios({
      method: "POST",
      url: `${props.url}/api/parse_menu`,
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((res) => {
        setMenuItems(res.data.menu);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Failed to parse menu.");
      });
  };

  useEffect(() => {
    if (authReady && token) {
      getmenu();
    }
  }, [authReady, token]);

  // Shared Paper Style
  const paperStyle = {
    p: isMobile ? 2 : 4,
    bgcolor: "#151515",
    borderRadius: 4,
    mb: 3,
    border: "1px solid rgba(255, 215, 160, 0.08)",
    boxShadow: "0 14px 28px rgba(0,0,0,0.5)",
  };

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
            Menu Management
          </Typography>

          {/* UPLOAD SECTION */}
          <Paper sx={paperStyle}>
            <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
              Upload Menu Source
            </Typography>
            <Box
              {...getRootProps()}
              sx={{
                border: "2px dashed rgba(230, 195, 122, 0.3)",
                borderRadius: 3,
                p: 4,
                cursor: "pointer",
                textAlign: "center",
                bgcolor: isDragActive
                  ? "rgba(230, 195, 122, 0.05)"
                  : "transparent",
                transition: "0.2s",
                "&:hover": { borderColor: "#c9a45c" },
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 40, color: "#c9a45c", mb: 1 }} />
              <Typography sx={{ color: "#aaa" }}>
                {files[0]
                  ? files[0].name
                  : "Drag & drop menu image/PDF or click"}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 3, bgcolor: "#c9a45c", color: "#000", fontWeight: 700 }}
              onClick={uploadFile}
              disabled={files.length === 0 || loading}
            >
              {loading ? <CircularProgress size={24} /> : "Parse with AI"}
            </Button>
          </Paper>

          {/* EDITING SECTION */}
          <Paper sx={paperStyle}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" sx={{ color: "#fff" }}>
                Menu Items
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addItem}
                sx={{ color: "#c9a45c" }}
              >
                Add Item
              </Button>
            </Stack>

            <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.1)" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {menuItems?.menu?.items?.map((item, index) => (
                <Stack
                  key={index}
                  direction={isMobile ? "column" : "row"}
                  spacing={2}
                  alignItems={isMobile ? "stretch" : "center"}
                >
                  <TextField
                    label="Item Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    sx={{
                      input: { color: "#fff" },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#333",
                      },
                    }}
                  />
                  <TextField
                    label="Price"
                    variant="outlined"
                    size="small"
                    sx={{
                      width: isMobile ? "100%" : "150px",
                      input: { color: "#fff" },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#333",
                      },
                    }}
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                  />
                  <IconButton
                    onClick={() => deleteItem(index)}
                    sx={{ color: "#ff4444" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
            </Box>

            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{ mt: 4, py: 1.5, fontWeight: 700 }}
              onClick={() => alert("Saved!")}
              disabled={!menuItems?.menu?.items?.length}
            >
              Save Final Menu
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
// import { Box, Typography, Button, Paper } from "@mui/material";
// import axios from "axios";
// import { useContext } from "react";
// import { AuthContext } from "./authContext";
// import TopBanner from "./TopBanner";
// import Sidebar from "./sidebar";

// export default function MenuUploader(props) {
//   const [files, setFiles] = useState([]);
//   const { token, authReady } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [menuItems, setMenuItems] = useState();
//   const [loading, setLoading] = useState(false);
//   const [linklist, setLinkList] = useState({ links: [] });

//   const getmenu = () => {
//     axios({
//       method: "GET",
//       url: `${props.url}/api/get_menu`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     })
//       .then((response) => {
//         setMenuItems(response.data);
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

//   const handleSubmit = () => {
//     axios({
//       method: "POST",
//       url: `${props.url}/api/submit_final_menu`,
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       data: menuItems,
//     })
//       .then((response) => {
//         console.log("Post Submitted:", response.data);
//         alert("Menu saved! (functionality to be implemented)");
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

//   // Dropzone callback
//   const onDrop = useCallback((acceptedFiles) => {
//     setFiles(acceptedFiles);
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "image/*": [],
//       "application/pdf": [],
//     },
//     maxFiles: 1,
//   });

//   // Upload file to backend
//   const uploadFile = async () => {
//     if (files.length === 0) return;
//     setLoading(true);

//     const formData = new FormData();
//     formData.append("file", files[0]);
//     axios({
//       method: "POST",
//       url: `${props.url}/api/parse_menu`,
//       data: formData,
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     })
//       .then((response) => {
//         console.log("Menu Parsed:", response.data);
//         setMenuItems(response.data.menu);
//         setLoading(false);
//       })
//       .catch((error) => {
//         if (error.response && error.response.status === 401) {
//           console.warn("Session expired or invalid token.");
//           localStorage.removeItem("token"); // optional: clear stored token
//           navigate("/");
//         }
//         alert("Failed to parse menu. Please try again.");
//         console.log(error.response);
//         console.log(error.response.status);
//         console.log(error.response.headers);
//       });
//   };

//   useEffect(() => {
//     if (!authReady) return;
//     if (!token) return;
//     getmenu();
//     getLinkList();
//   }, [authReady, token]);

//   return (
//     <>
//       {/* <TopBanner /> */}
//       <Sidebar />
//       <Box sx={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
//         <Paper
//           sx={{
//             p: 4,
//             textAlign: "center",
//             bgcolor: "background.paper",
//             borderRadius: 4,
//             border: "1px solid rgba(255,255,255,0.05)", // Subtle definition
//             boxShadow: `
//                       0 1px 0 rgba(255,255,255,0.06),
//                       0 14px 10px rgba(0,0,0,0.75)`,

//             transition: "all 0.25s ease",
//             "&:hover": {
//               transform: "translateY(-3px)",
//               boxShadow: `
//                       0 1px 0 rgba(255,255,255,0.08),
//                       0 20px 25px rgba(0,0,0,0.85)
//                     `,
//             },
//           }}
//         >
//           <Typography variant="h5" gutterBottom>
//             Upload Restaurant Menu
//           </Typography>

//           <Box
//             {...getRootProps()}
//             sx={{
//               border: "2px dashed gray",
//               borderRadius: 2,
//               p: 4,
//               cursor: "pointer",
//               //   backgroundColor: isDragActive ? "#f0f0f0" : "#fff",
//             }}
//           >
//             <input {...getInputProps()} />
//             <Typography>
//               {isDragActive
//                 ? "Drop the file here..."
//                 : "Drag & drop an image or PDF here, or click to select"}
//             </Typography>
//           </Box>

//           {files.length > 0 && (
//             <Typography mt={2}>Selected file: {files[0].name}</Typography>
//           )}

//           <Button
//             variant="contained"
//             sx={{ mt: 2 }}
//             onClick={uploadFile}
//             disabled={files.length === 0 || loading}
//           >
//             {loading ? "Processing..." : "Upload & Parse Menu"}
//           </Button>
//         </Paper>
//         <Paper
//           sx={{
//             p: 4,
//             textAlign: "center",
//             bgcolor: "background.paper",
//             borderRadius: 4,
//             border: "1px solid rgba(255,255,255,0.05)", // Subtle definition
//             boxShadow: `
//                       0 1px 0 rgba(255,255,255,0.06),
//                       0 14px 10px rgba(0,0,0,0.75)`,

//             transition: "all 0.25s ease",
//             "&:hover": {
//               transform: "translateY(-3px)",
//               boxShadow: `
//                       0 1px 0 rgba(255,255,255,0.08),
//                       0 20px 25px rgba(0,0,0,0.85)
//                     `,
//             },
//           }}
//         >
//           {menuItems?.menu?.items && (
//             <Box sx={{ mt: 4 }}>
//               <Typography variant="h6" gutterBottom>
//                 Menu Items
//               </Typography>

//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead>
//                   <tr>
//                     <th
//                       style={{
//                         borderBottom: "1px solid #ccc",
//                         padding: "0.5rem",
//                       }}
//                     >
//                       Item
//                     </th>
//                     <th
//                       style={{
//                         borderBottom: "1px solid #ccc",
//                         padding: "0.5rem",
//                       }}
//                     >
//                       Price
//                     </th>
//                     <th
//                       style={{
//                         borderBottom: "1px solid #ccc",
//                         padding: "0.5rem",
//                       }}
//                     >
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {menuItems.menu.items.map((m, i) => (
//                     <tr key={i}>
//                       <td
//                         style={{
//                           borderBottom: "1px solid #eee",
//                           padding: "0.5rem",
//                         }}
//                       >
//                         <input
//                           value={m.name}
//                           onChange={(e) => {
//                             const updated = [...menuItems.menu.items];
//                             updated[i].name = e.target.value;
//                             setMenuItems({ menu: { items: updated } });
//                           }}
//                           style={{ width: "100%" }}
//                         />
//                       </td>

//                       <td
//                         style={{
//                           borderBottom: "1px solid #eee",
//                           padding: "0.5rem",
//                         }}
//                       >
//                         <input
//                           value={m.price}
//                           onChange={(e) => {
//                             const updated = [...menuItems.menu.items];
//                             updated[i].price = e.target.value;
//                             setMenuItems({ menu: { items: updated } });
//                           }}
//                           style={{ width: "100%" }}
//                         />
//                       </td>

//                       <td
//                         style={{
//                           borderBottom: "1px solid #eee",
//                           padding: "0.5rem",
//                         }}
//                       >
//                         <button
//                           onClick={() => {
//                             const updated = menuItems.menu.items.filter(
//                               (_, idx) => idx !== i,
//                             );
//                             setMenuItems({ menu: { items: updated } });
//                           }}
//                           style={{
//                             background: "red",
//                             color: "white",
//                             border: "none",
//                             padding: "6px 10px",
//                             borderRadius: "6px",
//                             cursor: "pointer",
//                           }}
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))}

//                   {/* ADD NEW ITEM ROW */}
//                   <tr>
//                     <td colSpan="3" style={{ padding: "1rem 0" }}>
//                       <button
//                         onClick={() => {
//                           const updated = [
//                             ...menuItems.menu.items,
//                             { name: "New Item", price: "$0.00" },
//                           ];
//                           setMenuItems({ menu: { items: updated } });
//                         }}
//                         style={{
//                           background: "#1976d2",
//                           color: "white",
//                           border: "none",
//                           padding: "8px 14px",
//                           borderRadius: "6px",
//                           cursor: "pointer",
//                         }}
//                       >
//                         + Add Item
//                       </button>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </Box>
//           )}
//           <Button
//             variant="contained"
//             color="success"
//             sx={{ mt: 2 }}
//             onClick={handleSubmit}
//             disabled={
//               !menuItems?.menu?.items || menuItems.menu.items.length === 0
//             }
//           >
//             Save Menu
//           </Button>
//         </Paper>
//       </Box>
//     </>
//   );
// }
