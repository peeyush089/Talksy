import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import groupRoutes from "./routes/group.route.js"; // ✅ group routes

import { app, server } from "./lib/socket.js";
import { connectDB } from "./lib/db.js";
import callRoute from "./routes/call.route.js";

dotenv.config();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  "https://talksy-taupe.vercel.app",
].filter(Boolean);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin denied: ${origin}`));
  },
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes); // ✅
app.use("/api/call", callRoute);

const PORT = process.env.PORT || 5001;

server.on("error", (error) => {
  console.error("Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please stop the running process or use another PORT.`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  connectDB();
});