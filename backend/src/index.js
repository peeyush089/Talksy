import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import groupRoutes from "./routes/group.route.js";
import callRoute from "./routes/call.route.js";

import { app, server } from "./lib/socket.js";
import { connectDB } from "./lib/db.js";

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    console.error(`Missing required env var: ${envName}`);
    process.exit(1);
  }
}

// ✅ Build dynamic origin list for CORS
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
console.log("Allowed CORS origins:", allowedOrigins);

// ✅ CORS with credentials support - simplified for reliability
app.use(
  cors({
    origin: allowedOrigins, // Pass array directly instead of callback
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    optionsSuccessStatus: 200, // Ensure preflight returns 200
  })
);

// ✅ Additional preflight handler for extra safety
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  // Always set CORS headers for preflight
  if (!origin || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || allowedOrigins[0]);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
  }
  res.sendStatus(200); // Always return 200 for preflight
});

// ✅ Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/call", callRoute);

// ✅ Global error logger
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.stack || err);
  // Ensure CORS headers are present even when an internal error occurs
  try {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
  } catch (e) {
    console.error("Failed to set error CORS headers:", e?.stack || e);
  }
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5001;

// ✅ Error handler
server.on("error", (error) => {
  console.error("Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  }
  process.exit(1);
});

// ✅ Start server
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  connectDB();
});