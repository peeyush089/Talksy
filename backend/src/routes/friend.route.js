import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  getSentRequests,  // ✅ added
} from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/requests", protectRoute, getFriendRequests);
router.get("/sent", protectRoute, getSentRequests);       // ✅ added
router.get("/list", protectRoute, getFriends);
router.post("/send/:userId", protectRoute, sendFriendRequest);
router.post("/accept/:userId", protectRoute, acceptFriendRequest);
router.post("/reject/:userId", protectRoute, rejectFriendRequest);

export default router;