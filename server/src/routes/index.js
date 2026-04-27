require("dotenv").config();
const express    = require("express");
const http       = require("http");
const cors       = require("cors");
const mongoose   = require("mongoose");
const { Server } = require("socket.io");

const authRoutes      = require("./routes/auth");
const userRoutes      = require("./routes/users");
const complaintRoutes = require("./routes/complaints");
const chatRoutes      = require("./routes/chat");
const registerSocket  = require("./utils/socket");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"] },
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"] }));
app.options("*", cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"] }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/chat",       chatRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// ── Socket.io ────────────────────────────────────────────────
registerSocket(io);

// ── Database + Listen ────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch((err) => { console.error("❌  MongoDB connection error:", err); process.exit(1); });
