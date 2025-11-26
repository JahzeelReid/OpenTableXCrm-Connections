import { useNavigate } from "react-router-dom";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";

export default function MenuUploader() {
  const [files, setFiles] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

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
        setMenuItems(response.data);
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

    // try {
    //   const res = await axios.post(
    //     "http://localhost:5000/parse_menu",
    //     formData,
    //     {
    //       headers: { "Content-Type": "multipart/form-data" },
    //     }
    //   );
    //   setMenuItems(res.data.menu);
    // } catch (err) {
    //   console.error(err);
    //   alert("Failed to parse menu. Please try again.");
    // } finally {
    //   setLoading(false);
    // }
  };

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

      {menuItems.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {menuItems.map((m, i) => (
                <tr key={i}>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {m.item}
                  </td>
                  <td
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "0.5rem",
                    }}
                  >
                    {m.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}
