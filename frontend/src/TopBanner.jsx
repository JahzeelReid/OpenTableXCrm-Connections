import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function TopBanner() {
  const navigate = useNavigate();
  const API_BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:5000" // Development
      : "https://opentablexcrm-connections.onrender.com"; // Production

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Left side (logo or title if you want later) */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation buttons */}
        <Button color="inherit" onClick={() => navigate("/dashboard")}>
          Dashboard
        </Button>

        <Button color="inherit" onClick={() => navigate("/menu")}>
          Menu
        </Button>

        <Button color="inherit" onClick={() => navigate("/setup")}>
          Setup
        </Button>
        <Button color="inherit">{API_BASE_URL}</Button>
      </Toolbar>
    </AppBar>
  );
}
