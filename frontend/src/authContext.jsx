// authContext.js
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Load token from storage if context is empty
    if (!token) {
      const storedToken = sessionStorage.getItem("token"); // or localStorage
      if (storedToken) setToken(storedToken);
      setAuthReady(true);
    }
  }, [token, setToken]);

  return (
    <AuthContext.Provider value={{ token, setToken, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}
