import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import ClientPortal from "./dashboard";
import Dashboard from "./dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import DayScheduler from "./DayScheduler";
import MenuUploader from "./MenuUploader";
import { useContext, useEffect } from "react";
import { AuthContext } from "./authContext";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import LinkUploader from "./LinkSelecter";
import ConversationPage from "./ConvoPage";

function App() {
  const [count, setCount] = useState(0);
  const API_BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:5000" // Development
      : "https://opentablexcrm-connections.onrender.com"; // Production

  const { token, setToken } = useContext(AuthContext);

  // 1. Define the custom look
  const theme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#0A0A0A", // The deep matte black from your image
        paper: "#121212", // Slightly lighter for cards/sidebar
      },
      primary: {
        main: "#C5A368", // The Gold accent color
      },
      text: {
        primary: "#FFFFFF",
        secondary: "#C5A368", // Making secondary text gold by default
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: "0.05em",
      },
    },
    shape: {
      borderRadius: 12, // Rounded corners for a modern look
    },
  });

  return (
    <>
      <ThemeProvider theme={theme}>
        {/* CssBaseline resets browser styles to match the dark theme */}
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<Login url={API_BASE_URL} />} />
            <Route
              path="/dashboard"
              element={<Dashboard url={API_BASE_URL} />}
            />
            <Route
              path="/schedule"
              element={<DayScheduler url={API_BASE_URL} />}
            />
            <Route path="/menu" element={<MenuUploader url={API_BASE_URL} />} />
            <Route
              path="/links"
              element={<LinkUploader url={API_BASE_URL} />}
            />
            <Route
              path="/conversations"
              element={<ConversationPage url={API_BASE_URL} />}
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </>
  );
}

export default App;
