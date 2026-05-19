import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    const username = email.split("@")[0];
    const user = await User.create({ fullName, email, password: hashed, username });

    const token = generateToken(user._id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Auth signup error:", error?.stack || error);
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

    const token = generateToken(user._id);

    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Auth login error:", error?.stack || error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.status(200).json({ message: "Logged out" });
};

export const checkAuth = (req, res) => {
  res.status(200).json(req.user);
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, username, fullName, email } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (profilePic) {
      const uploaded = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploaded.secure_url;
    }

    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (email)    updateData.email    = email;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Auth updateProfile error:", error?.stack || error);
    res.status(500).json({ message: "Server error" });
  }
};