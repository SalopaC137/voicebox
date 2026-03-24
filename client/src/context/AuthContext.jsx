import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { syncOneSignalUser } from "../utils/onesignal";

const AuthCtx = createContext(null);
const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore user on mount (check token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setCurrentUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      setCurrentUser(res.data.user);
      await syncOneSignalUser(res.data?.user?._id || null);

      setError(null);
      return "ok";
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      return msg;
    }
  };

  const register = async (data) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, data);
      // No token returned until verified
      setError(null);
      return res.data.message;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");

    syncOneSignalUser(null).catch((err) => {
      console.error("Failed to logout OneSignal user:", err);
    });

    setCurrentUser(null);
  };

  return (
    <AuthCtx.Provider value={{ currentUser, loading, error, login, logout, register }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
