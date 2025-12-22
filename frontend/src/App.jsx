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
import TopBanner from "./TopBanner";
import { useContext, useEffect } from "react";
import { AuthContext } from "./authContext";

function App() {
  const [count, setCount] = useState(0);
  const API_BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:5000" // Development
      : "https://csdatabasews.onrender.com"; // Production

  const { token, setToken } = useContext(AuthContext);

  return (
    <>
      <Router>
        <TopBanner />
        <Routes>
          <Route path="/" element={<Login url={API_BASE_URL} />} />
          <Route path="/dashboard" element={<Dashboard url={API_BASE_URL} />} />
          <Route path="/setup" element={<DayScheduler url={API_BASE_URL} />} />
          <Route path="/menu" element={<MenuUploader url={API_BASE_URL} />} />
          {/* <Route path="/new-post" element={<NewPost />} /> */}
        </Routes>
      </Router>
      {/* <Dashboard /> */}
    </>
  );
}

export default App;
