import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function TopBanner() {
  const navigate = useNavigate();
  const API_BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:5000" // Development
      : "https://opentablexcrm-connections.onrender.com"; // Production

  const navButtonSx = {
    color: "#d8b86a",
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "none",
    fontSize: "0.9rem",
    px: 2,
    borderRadius: "10px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(216, 184, 106, 0.12)",
    },
  };

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        background: "linear-gradient(180deg, #0f0f0f 0%, #151515 100%)",
        color: "#e6c37a",
        borderBottom: "1px solid rgba(255, 215, 160, 0.08)",
      }}

      // sx={{ backgroundColor: "white", color: "black" }}
    >
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
      </Toolbar>
    </AppBar>
  );
}
