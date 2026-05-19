import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    console.log("Auth check - cookies received:", {
      allCookies: Object.keys(req.cookies),
      hasJwt: !!token,
      origin: req.headers.origin,
    });

    if (!token) {
      console.log("No JWT token found in cookies");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Auth verification error:", error?.message || error);
    res.status(401).json({ message: "Invalid token" });
  }
};