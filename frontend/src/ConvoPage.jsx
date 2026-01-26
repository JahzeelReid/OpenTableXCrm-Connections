import React, { useEffect, useState } from "react";
import {
  Container,
  Fab,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PostEditor from "./Posteditor";
import PostList from "./Postlist";
import Analytics from "./Analytics";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "./authContext";
import TopBanner from "./TopBanner";
import Sidebar from "./sidebar";
import CircularProgress from "@mui/material/CircularProgress";
import PostModal from "./Modal";
import ConversationsPage from "./ConversationsComponent";

export default function ConversationPage(props) {
  return (
    <>
      <Sidebar />
      <ConversationsPage url={props.url} />
    </>
  );
}
