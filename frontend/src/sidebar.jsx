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
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";

import { useTheme, useMediaQuery } from "@mui/material";
import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import ForumIcon from "@mui/icons-material/Forum";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 240;

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
    "&.Mui-selected": {
      backgroundColor: "rgba(216, 184, 106, 0.2)", // A bit more opaque
      // boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // The shadow you wanted/
      border: "1px solid rgba(216, 184, 106, 0.3)", // Subtle border
      "& .MuiTypography-root": {
        fontWeight: "bold", // Make text pop
      },
      // "&:hover": {
      //   backgroundColor: "rgba(216, 184, 106, 0.3)", // Darker on hover even when selected
      // },

      boxShadow: `
                      0 1px 0 rgba(255,255,255,0.06),
                      0 10px 5px rgba(0,0,0,0.75)`,

      transition: "all 0.25s ease",
      "&:hover": {
        transform: "translateY(-3px)",
        boxShadow: `
                      0 1px 0 rgba(255,255,255,0.08),
                      0 15px 20px rgba(0,0,0,0.85)
                    `,
      },
    },
  };

  return (
    // <Drawer
    //   variant="permanent"
    //   sx={{
    //     width: drawerWidth,
    //     flexShrink: 0,
    //     "& .MuiDrawer-paper": {
    //       width: drawerWidth,
    //       boxSizing: "border-box",
    //       background: "linear-gradient(180deg, #0b0b0b 0%, #151515 100%)",
    //       borderRight: "1px solid rgba(255, 215, 160, 0.08)",
    //     },
    //   }}
    <>
      {isMobile && !mobileOpen && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: (theme) => theme.zIndex.drawer + 2,
            backgroundColor: "#0b0b0b",
            color: "#e6c37a",
            "&:hover": {
              backgroundColor: "#151515",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }} // better mobile performance
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
          <ListItemButton
            sx={navItemSx}
            onClick={() => navigate("/dashboard")}
            selected={location.pathname === "/dashboard"}
          >
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

          <ListItemButton
            sx={navItemSx}
            onClick={() => navigate("/menu")}
            selected={location.pathname === "/menu"}
          >
            <ListItemIcon>
              <AutoAwesomeIcon />
            </ListItemIcon>
            <ListItemText primary="Menu" />
          </ListItemButton>

          <ListItemButton
            sx={navItemSx}
            onClick={() => navigate("/schedule")}
            selected={location.pathname === "/schedule"}
          >
            <ListItemIcon>
              <ViewModuleIcon />
            </ListItemIcon>
            <ListItemText primary="Schedule" />
          </ListItemButton>

          <ListItemButton
            sx={navItemSx}
            onClick={() => navigate("/conversations")}
            selected={location.pathname === "/conversations"}
          >
            <ListItemIcon>
              {/* <ViewModuleIcon /> */}
              <ForumIcon />
            </ListItemIcon>
            <ListItemText primary="Conversations" />
          </ListItemButton>

          <ListItemButton
            sx={navItemSx}
            onClick={() => navigate("/links")}
            selected={location.pathname === "/links"}
          >
            <ListItemIcon>
              {/* <ViewModuleIcon /> */}
              <LinkOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Links" />
          </ListItemButton>
        </List>

        {/* Bottom section */}
        <Box sx={{ flexGrow: 1 }} />

        <List sx={{ mb: 2 }}>
          <ListItemButton
            sx={navItemSx}
            onClick={() => navigate("/settings")}
            selected={location.pathname === "/settings"}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
