import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./authContext";

import Sidebar from "./sidebar";

export default function LinkUploader(props) {
  const [files, setFiles] = useState([]);
  const { token, authReady } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState();
  const [loading, setLoading] = useState(false);
  const [linklist, setLinkList] = useState({ links: [] });

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
  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    getLinkList();
  }, [authReady, token]);

  return (
    <>
      <Sidebar />
      <Box>
        {linklist?.links && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Menu Items
            </Typography>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      padding: "0.5rem",
                    }}
                  >
                    Link
                  </th>

                  <th
                    style={{
                      borderBottom: "1px solid #ccc",
                      padding: "0.5rem",
                    }}
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
                <tr>
                  <td colSpan="3" style={{ padding: "1rem 0" }}>
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
          onClick={submitLinks}
          disabled={!linklist.links || linklist.links.length === 0}
        >
          Save Links
        </Button>
      </Box>
    </>
  );
}
