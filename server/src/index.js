require("dotenv").config();
const express    = require("express");
const http       = require("http");
const cors       = require("cors");
const mongoose   = require("mongoose");
const { Server } = require("socket.io");

const authRoutes       = require("./routes/auth");
const userRoutes       = require("./routes/users");
const complaintRoutes  = require("./routes/complaints");
const chatRoutes       = require("./routes/chat");
const registerSocket   = require("./utils/socket");
const { initializeCounters } = require("./controllers/authController");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: ["https://voicebox-git-main-salopac137s-projects.vercel.app", "https://voicebox-mnisk2e7e-salopac137s-projects.vercel.app", "http://localhost:5173"], methods: ["GET","POST"] },
});

// Make io accessible to routes/controllers
app.locals.io = io;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://voicebox-coral.vercel.app",
    /\.vercel\.app$/
  ],
  credentials: true
}));
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
  .then(async () => {
    console.log("✅  MongoDB connected");
    await initializeCounters();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch((err) => { console.error("❌  MongoDB connection error:", err); process.exit(1); });
