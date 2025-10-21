import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import ClientPortal from "./dashboard";
import Dashboard from "./dashboard";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      {/* // <ClientPortal /> */}
      <Dashboard />
    </>
  );
}

export default App;
