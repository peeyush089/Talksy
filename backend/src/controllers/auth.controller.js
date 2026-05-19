import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";

const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
};

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // ✅ auto generate username from email
    const username = email.split("@")[0];

    const user = await User.create({ fullName, email, password: hashed, username });

    generateToken(user._id, res);
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    generateToken(user._id, res);
    res.status(200).json(user);
  } catch (error) {
    console.error("Auth login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logged out" });
};

export const checkAuth = (req, res) => {
  res.status(200).json(req.user);
};

// ✅ update profile — pic + username
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, username } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (profilePic) {
      const uploaded = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploaded.secure_url;
    }

    if (username) {
      updateData.username = username;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};