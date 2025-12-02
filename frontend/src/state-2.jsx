import { useNavigate } from "react-router-dom";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";

export default function MenuUploader() {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState();
  //     {
  //     menu: {
  //       items: [
  //         {
  //           name: "House Salad",
  //           price: "$6.00",
  //         },
  //         {
  //           name: "Edamame",
  //           price: "$8.50",
  //         },
  //         {
  //           name: "Spicy Garlic Edamame",
  //           price: "$12.25",
  //         },
  //         {
  //           name: "Fried Gyoza (6 pcs)",
  //           price: "$8.00",
  //         },
  //         {
  //           name: "Age Dashi Tofu",
  //           price: "$9.75",
  //         },
  //         {
  //           name: "Chicken Karaage",
  //           price: "$10.75",
  //         },
  //         {
  //           name: "Fried Ika Geso",
  //           price: "$10.75",
  //         },
  //         {
  //           name: "Fried Oyster",
  //           price: "$10.75",
  //         },
  //         {
  //           name: "Tempura Appetizer",
  //           price: "$11.50",
  //         },
  //         {
  //           name: "Soft Shell Crab",
  //           price: "$16.50",
  //         },
  //         {
  //           name: "Salmon Collar",
  //           price: "$15.75",
  //         },
  //         {
  //           name: "Yellowtail Collar",
  //           price: "$16.50",
  //         },
  //         {
  //           name: "Inari (2 pcs)",
  //           price: "$4.50",
  //         },
  //         {
  //           name: "Seafood Nachos",
  //           price: "$8.00",
  //         },
  //         {
  //           name: "Kyuri-Su",
  //           price: "$5.25",
  //         },
  //         {
  //           name: "Tako-Su",
  //           price: "$8.75",
  //         },
  //         {
  //           name: "Ebi-Su",
  //           price: "$8.75",
  //         },
  //         {
  //           name: "Green Mussel 4pcs",
  //           price: "$11.50",
  //         },
  //         {
  //           name: "Monk Fish Liver",
  //           price: "$11.50",
  //         },
  //         {
  //           name: "Tuna Poke*",
  //           price: "$13.00",
  //         },
  //         {
  //           name: "Salmon Skin Salad",
  //           price: "$17.50",
  //         },
  //         {
  //           name: "Salmon Salad*",
  //           price: "$21.50",
  //         },
  //       ],
  //     },
  //   }
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    axios({
      method: "POST",
      url: `/api/submit_final_menu`,
      data: menuItems,
    })
      .then((response) => {
        console.log("Post Submitted:", response.data);
        alert("Menu saved! (functionality to be implemented)");
        navigate("/dashboard");
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
    </Box>
  );
}
