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
const notificationRoutes = require("./routes/notifications");
const registerSocket   = require("./utils/socket");
const { initializeCounters } = require("./controllers/authController");

const missingOneSignalConfig = ["ONESIGNAL_APP_ID", "ONESIGNAL_API_KEY"]
  .filter((key) => !process.env[key]);
if (missingOneSignalConfig.length > 0) {
  console.warn(`[Startup] OneSignal disabled: missing ${missingOneSignalConfig.join(", ")}`);
}

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: [
      "https://voicebox-coral.vercel.app",
      "https://voicebox-git-main-salopac137s-projects.vercel.app",
      "https://voicebox-mnisk2e7e-salopac137s-projects.vercel.app",
      "https://voicebox.qzz.io",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to routes/controllers
app.locals.io = io;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://voicebox-coral.vercel.app",
    "https://voicebox.qzz.io",
    /\.vercel\.app$/
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/chat",       chatRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

// ── Socket.io ────────────────────────────────────────────────
registerSocket(io);

// ── Database + Listen ────────────────────────────────────────
if (!process.env.MONGO_URI) {
  console.error("❌  MONGO_URI is not set. Add it in Render environment variables before starting the server.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));

async function connectToMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  MongoDB connected");
    await initializeCounters();
  } catch (err) {
    console.error("❌  MongoDB connection error:", err);
    console.warn("[Startup] Retrying MongoDB connection in 15 seconds...");
    setTimeout(connectToMongo, 15000);
  }
}

connectToMongo();
