import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { isAdminRole } from "../utils/helpers";

const AppCtx = createContext(null);
const API_BASE = `${import.meta.env.VITE_SERVER_URL}/api`;
const SOCKET_URL = `${import.meta.env.VITE_SERVER_URL}`;

export function AppProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [complaintBanner, setComplaintBanner] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const socketRef = useRef(null);
  const bannerTimeoutRef = useRef(null);

  const pushToast = (notification) => {
    const toastId = `${notification._id || "toast"}-${Date.now()}`;
    const toast = {
      id: toastId,
      message: notification.message,
      createdAt: notification.createdAt || new Date().toISOString(),
      type: notification.type || "system",
    };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 6000);
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const dismissComplaintBanner = () => {
    setComplaintBanner(null);
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
  };

  const showComplaintBanner = (complaint) => {
    const submitterId = String(complaint?.submittedBy?._id || complaint?.submittedBy || "");
    const isOwnComplaint = submitterId && String(currentUser?._id) === submitterId;
    if (isOwnComplaint) return;

    const typeLabel = complaint?.type === "suggestion" ? "Suggestion" : "Complaint";
    const senderName = complaint?.isAnonymous
      ? "Anonymous user"
      : `${complaint?.submittedBy?.firstName || ""} ${complaint?.submittedBy?.lastName || ""}`.trim() || "A user";

    setComplaintBanner({
      id: `${complaint?._id || "complaint"}-${Date.now()}`,
      label: `New ${typeLabel} Received`,
      message: `${senderName} sent \"${complaint?.title || "Untitled"}\".`,
    });

    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = setTimeout(() => {
      setComplaintBanner(null);
      bannerTimeoutRef.current = null;
    }, 5000);
  };

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

  // Keep OneSignal identity in sync with the authenticated user so
  // server-side targeted pushes can reach this browser subscription.
  useEffect(() => {
    const oneSignalDeferred = window.OneSignalDeferred = window.OneSignalDeferred || [];

    oneSignalDeferred.push(async (OneSignal) => {
      try {
        if (!currentUser?._id) {
          await OneSignal.logout();
          return;
        }

        await OneSignal.login(String(currentUser._id));
      } catch (err) {
        console.error("Failed to sync OneSignal user identity:", err);
      }
    });
  }, [currentUser?._id]);

  // Fetch complaints, chat messages, and missed notifications on login
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

      axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setNotifications(rows);
        rows.filter((n) => !n.read).slice(0, 3).forEach((n) => pushToast(n));
      })
      .catch((err) => console.error("Failed to fetch notifications:", err));
    } else if (!currentUser && !authLoading) {
      setComplaints([]);
      setMessages([]);
      setNotifications([]);
      setToasts([]);
      setComplaintBanner(null);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, []);

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

      // Listen for newly created complaints/suggestions
      socket.on("complaint-created", (data) => {
        console.log("🆕 Complaint created:", data._id);
        setComplaints((prev) => {
          const exists = prev.some((c) => String(c._id) === String(data._id));
          if (exists) return prev;
          return [data, ...prev];
        });
        showComplaintBanner(data);
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

      // Listen for incoming notifications
      socket.on("notification", (notification) => {
        setNotifications((prev) => {
          const alreadyExists = prev.some((n) => String(n._id) === String(notification._id));
          if (alreadyExists) return prev;
          return [notification, ...prev];
        });
        pushToast(notification);
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

  const markNotificationAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => (
        String(n._id) === String(id) ? { ...n, read: true } : n
      )));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      console.error("Failed to send message:", err);
      throw err;
    }
  };

  const joinChatRoom = (roomId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("join-room", { room: roomId });
    }
  };

  const leaveChatRoom = (roomId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("leave-room", { room: roomId });
    }
  };

  return (
    <AppCtx.Provider value={{
      complaints, messages, notifications, unreadCount, toasts, complaintBanner, users,
      // expose setter so components can remove suspended users or apply
      // other real–time updates.
      setUsers,
      addComplaint, updateComplaint, deleteComplaint, addReply, addAdminNote, addMessage,
      markNotificationAsRead, markAllNotificationsAsRead, dismissToast, dismissComplaintBanner,
      joinChatRoom, leaveChatRoom,
      page, setPage,
      navOpen, setNavOpen,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
