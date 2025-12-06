import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import ClientPortal from "./dashboard";
import Dashboard from "./dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import DayScheduler from "./DayScheduler";
import MenuParser from "./state-2";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<DayScheduler />} />
          <Route path="/menu" element={<MenuParser />} />
          {/* <Route path="/new-post" element={<NewPost />} /> */}
        </Routes>
      </Router>
      {/* <Dashboard /> */}
    </>
  );
}

export default App;
