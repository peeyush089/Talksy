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

// ✅ CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes("localhost")) return callback(null, true);
    if (origin.includes("vercel.app")) return callback(null, true);
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));

// ✅ Preflight
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
  res.sendStatus(200);
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