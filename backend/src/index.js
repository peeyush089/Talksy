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

// ✅ Allowed frontend URLs
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://talksy-taupe.vercel.app",
  "https://talksy-dagugfder-peeyush089s-projects.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    // ✅ allow localhost
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // ✅ allow ALL vercel domains (important fix)
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    // ❌ block others
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ✅ VERY IMPORTANT: handle preflight requests
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
}));

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