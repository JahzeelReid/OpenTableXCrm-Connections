import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;

export default function Sidebar() {
  const navigate = useNavigate();

  const navItemSx = {
    borderRadius: "12px",
    mx: 1,
    mb: 0.5,
    color: "#d8b86a",
    transition: "all 0.2s ease",
    "& .MuiListItemIcon-root": {
      color: "#d8b86a",
      minWidth: 40,
    },
    "&:hover": {
      backgroundColor: "rgba(216, 184, 106, 0.12)",
    },
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "linear-gradient(180deg, #0b0b0b 0%, #151515 100%)",
          borderRight: "1px solid rgba(255, 215, 160, 0.08)",
        },
      }}
    >
      {/* Logo / Brand */}
      <Box sx={{ px: 3, py: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "#e6c37a",
          }}
        >
          TABLE TEXT
        </Typography>
        <Typography
          sx={{
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            color: "rgba(230, 195, 122, 0.6)",
          }}
        >
          Pro
        </Typography>
      </Box>

      {/* Navigation */}
      <List>
        <ListItemButton sx={navItemSx} onClick={() => navigate("/dashboard")}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              fontSize: "0.9rem",
              letterSpacing: "0.04em",
            }}
          />
        </ListItemButton>

        <ListItemButton sx={navItemSx} onClick={() => navigate("/menu")}>
          <ListItemIcon>
            <AutoAwesomeIcon />
          </ListItemIcon>
          <ListItemText primary="Menu" />
        </ListItemButton>

        <ListItemButton sx={navItemSx} onClick={() => navigate("/schedule")}>
          <ListItemIcon>
            <ViewModuleIcon />
          </ListItemIcon>
          <ListItemText primary="Schedule" />
        </ListItemButton>
      </List>

      {/* Bottom section */}
      <Box sx={{ flexGrow: 1 }} />

      <List sx={{ mb: 2 }}>
        <ListItemButton sx={navItemSx} onClick={() => navigate("/settings")}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
