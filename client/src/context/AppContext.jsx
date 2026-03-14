import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { isAdminRole } from "../utils/helpers";

const AppCtx = createContext(null);
const API_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

export function AppProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const socketRef = useRef(null);

  // Sync page state with auth state
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        // show landing by default for unauthenticated users
        setPage(prev => {
          // if user already clicked login/register keep that state
          if (prev === "login" || prev === "register") return prev;
          return "landing";
        });
      } else {
        // Only set to dashboard if we don't have a specific page already
        if (page === "dashboard" || page === "login" || page === "landing") {
          setPage("dashboard");
        }
      }
      setAppLoading(false);
    }
  }, [authLoading, currentUser]);

  // Fetch complaints when user logs in
  useEffect(() => {
    if (currentUser && !authLoading) {
      const token = localStorage.getItem("token");
      axios.get(`${API_BASE}/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setComplaints(res.data || []))
      .catch(err => console.error("Failed to fetch complaints:", err));

      axios.get(`${API_BASE}/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data || []))
      .catch(err => console.error("Failed to fetch messages:", err));
    } else if (!currentUser && !authLoading) {
      setComplaints([]);
      setMessages([]);
    }
  }, [currentUser, authLoading]);

  // Fetch users if admin
  useEffect(() => {
    if (currentUser && isAdminRole(currentUser.role)) {
      const token = localStorage.getItem("token");
      axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to fetch users:", err));
    } else {
      setUsers([]);
    }
  }, [currentUser]);

  // Socket.io real-time updates
  useEffect(() => {
    if (currentUser && !authLoading) {
      const token = localStorage.getItem("token");
      const socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
      });

      socket.on("connect", () => {
        console.log("✓ Socket connected");
        // Join user-specific rooms
        socket.emit("join-user", { userId: currentUser._id });
        // Join role-based rooms
        if (currentUser.role === "school_admin") {
          socket.emit("join-room", { room: `school:${currentUser.schoolId}` });
        } else if (currentUser.role === "dept_admin") {
          socket.emit("join-room", { room: `dept:${currentUser.department}` });
        }
      });

      // Listen for new replies - refresh the specific complaint
      socket.on("reply-added", (data) => {
        console.log("📩 New reply received:", data.complaintId);
        setComplaints(prev => prev.map(c => 
          c._id === data.complaintId ? { ...c, replies: data.replies, status: data.status, readBy: data.readBy } : c
        ));
      });

      // Listen for complaint updates
      socket.on("complaint-updated", (data) => {
        console.log("🔄 Complaint updated:", data._id);
        setComplaints(prev => prev.map(c => c._id === data._id ? { ...c, ...data } : c));
      });

      // Listen for user events (admins only)
      socket.on("user-added", (u) => {
        console.log("👤 New user added:", u.uniqueId);
        setUsers(prev => [u, ...prev]);
      });
      socket.on("user-updated", (u) => {
        console.log("🔧 User updated:", u.uniqueId);
        setUsers(prev => prev.map(x => x._id === u._id ? u : x));
      });
      socket.on("user-removed", (id) => {
        console.log("❌ User removed:", id);
        setUsers(prev => prev.filter(x => x._id !== id));
      });

      // Listen for forced logout (e.g. suspension)
      socket.on("force-logout", (data) => {
        alert(data.message || "You have been logged out.");
        localStorage.removeItem("token");
        window.location.reload();
      });

      // Listen for new messages
      socket.on("new_message", (msg) => {
        console.log("💬 New message received:", msg);
        setMessages(prev => [...prev, msg]);
      });
      socket.on("disconnect", () => {
        console.log("✗ Socket disconnected");
      });

      socketRef.current = socket;

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [currentUser, authLoading]);

  // Fetch users if admin
  useEffect(() => {
    if (currentUser && isAdminRole(currentUser.role)) {
      const token = localStorage.getItem("token");
      axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to fetch users:", err));
    } else {
      setUsers([]);
    }
  }, [currentUser]);

  const addComplaint = async (c) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/complaints`, c, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error("Failed to add complaint:", err);
      throw err;
    }
  };

  const updateComplaint = async (id, updates) => {
    try {
      const token = localStorage.getItem("token");
      // only status updates are currently supported/needed by the UI;
      // the backend endpoint lives at /status
      const res = await axios.patch(`${API_BASE}/complaints/${id}/status`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => prev.map(c => c._id === id ? res.data : c));
      return res.data;
    } catch (err) {
      console.error("Failed to update complaint:", err);
      throw err;
    }
  };

  const deleteComplaint = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error("Failed to delete complaint:", err);
      throw err;
    }
  };

  const addReply = async (complaintId, reply) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/complaints/${complaintId}/reply`, reply, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => prev.map(c => c._id === complaintId ? res.data : c));
      return res.data;
    } catch (err) {
      console.error("Failed to add reply:", err);
      throw err;
    }
  };

  const addAdminNote = async (complaintId, note) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/complaints/${complaintId}/admin-note`, note, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => prev.map(c => c._id === complaintId ? res.data : c));
      return res.data;
    } catch (err) {
      console.error("Failed to add admin note:", err);
      throw err;
    }
  };

  const addMessage = async (msg) => {
    try {
      // Use Socket.io for real-time delivery
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("send_message", msg);
      } else {
        // Fallback to HTTP if socket is not connected
        const token = localStorage.getItem("token");
        await axios.post(`${API_BASE}/chat/messages`, msg, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Failed to add message:", err);
      throw err;
    }
  };

  return (
    <AppCtx.Provider value={{
      complaints, messages, users,
      // expose setter so components can remove suspended users or apply
      // other real–time updates.
      setUsers,
      addComplaint, updateComplaint, deleteComplaint, addReply, addAdminNote, addMessage,
      page, setPage,
      navOpen, setNavOpen,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
