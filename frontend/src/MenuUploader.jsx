import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./authContext";

export default function MenuUploader(props) {
  const [files, setFiles] = useState([]);
  const { token, authReady } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState();
  const [loading, setLoading] = useState(false);
  const [linklist, setLinkList] = useState({ links: [] });

  const getmenu = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_menu`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setMenuItems(response.data);
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

  const handleSubmit = () => {
    axios({
      method: "POST",
      url: `${props.url}/api/submit_final_menu`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: menuItems,
    })
      .then((response) => {
        console.log("Post Submitted:", response.data);
        alert("Menu saved! (functionality to be implemented)");
        // navigate("/dashboard");
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

  const submitLinks = () => {
    axios({
      method: "POST",
      url: `${props.url}/api/create_tracked_link`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: linklist,
    })
      .then((response) => {
        console.log("Links Submitted:", response.data);
        alert("Links saved! (functionality to be implemented)");
        // navigate("/dashboard");
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

  const getLinkList = () => {
    axios({
      method: "GET",
      url: `${props.url}/api/get_tracked_links`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setLinkList(response.data);
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

  // Dropzone callback
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "application/pdf": [],
    },
    maxFiles: 1,
  });

  // Upload file to backend
  const uploadFile = async () => {
    if (files.length === 0) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", files[0]);
    axios({
      method: "POST",
      url: `/api/parse_menu`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => {
        console.log("Menu Parsed:", response.data);
        setMenuItems(response.data.menu);
        setLoading(false);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        alert("Failed to parse menu. Please try again.");
        console.log(error.response);
        console.log(error.response.status);
        console.log(error.response.headers);
      });
  };

  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    getmenu();
    getLinkList();
  }, [authReady, token]);

  return (
    <Box sx={{ maxWidth: 600, margin: "2rem auto", textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>
        Upload Restaurant Menu
      </Typography>

      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed gray",
          borderRadius: 2,
          p: 4,
          cursor: "pointer",
          //   backgroundColor: isDragActive ? "#f0f0f0" : "#fff",
        }}
      >
        <input {...getInputProps()} />
        <Typography>
          {isDragActive
            ? "Drop the file here..."
            : "Drag & drop an image or PDF here, or click to select"}
        </Typography>
      </Box>

      {files.length > 0 && (
        <Typography mt={2}>Selected file: {files[0].name}</Typography>
      )}

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={uploadFile}
        disabled={files.length === 0 || loading}
      >
        {loading ? "Processing..." : "Upload & Parse Menu"}
      </Button>

      {menuItems?.menu?.items && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Menu Items
          </Typography>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}
                >
                  Item
                </th>
                <th
                  style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}
                >
                  Price
                </th>
                <th
                  style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {menuItems.menu.items.map((m, i) => (
                <tr key={i}>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <input
                      value={m.name}
                      onChange={(e) => {
                        const updated = [...menuItems.menu.items];
                        updated[i].name = e.target.value;
                        setMenuItems({ menu: { items: updated } });
                      }}
                      style={{ width: "100%" }}
                    />
                  </td>

                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <input
                      value={m.price}
                      onChange={(e) => {
                        const updated = [...menuItems.menu.items];
                        updated[i].price = e.target.value;
                        setMenuItems({ menu: { items: updated } });
                      }}
                      style={{ width: "100%" }}
                    />
                  </td>

                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() => {
                        const updated = menuItems.menu.items.filter(
                          (_, idx) => idx !== i
                        );
                        setMenuItems({ menu: { items: updated } });
                      }}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {/* ADD NEW ITEM ROW */}
              <tr>
                <td colSpan="3" style={{ padding: "1rem 0" }}>
                  <button
                    onClick={() => {
                      const updated = [
                        ...menuItems.menu.items,
                        { name: "New Item", price: "$0.00" },
                      ];
                      setMenuItems({ menu: { items: updated } });
                    }}
                    style={{
                      background: "#1976d2",
                      color: "white",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    + Add Item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </Box>
      )}
      <Button
        variant="contained"
        color="success"
        sx={{ mt: 2 }}
        onClick={handleSubmit}
        disabled={!menuItems?.menu?.items || menuItems.menu.items.length === 0}
      >
        Save Menu
      </Button>
      {linklist?.links && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Menu Items
          </Typography>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}
                >
                  Link
                </th>

                <th
                  style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {linklist.links.map((link, i) => (
                <tr key={i}>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <input
                      value={link}
                      onChange={(e) => {
                        const updated = linklist.links.map((item, idx) =>
                          idx === i ? e.target.value : item
                        );

                        setLinkList({ links: updated });
                      }}
                      style={{ width: "100%" }}
                    />
                  </td>

                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() => {
                        const updated = linklist.links.filter(
                          (_, idx) => idx !== i
                        );
                        setLinkList({ links: updated });
                      }}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      <button
        onClick={() => {
          setLinkList((prev) => ({
            links: [...prev.links, ""],
          }));
        }}
        style={{
          marginTop: "12px",
          background: "#1976d2",
          color: "white",
          border: "none",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        + Add Link
      </button>
      <Button
        variant="contained"
        color="success"
        sx={{ mt: 2 }}
        onClick={submitLinks}
        disabled={!linklist.links || linklist.links.length === 0}
      >
        Save Menu
      </Button>
    </Box>
  );
}
