import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import ClientPortal from "./dashboard";
import Dashboard from "./dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route path="/new-post" element={<NewPost />} /> */}
        </Routes>
      </Router>
      {/* <Dashboard /> */}
    </>
  );
}

export default App;
