import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  addMember,
  removeMember,
  makeAdmin,
  updateGroup,
  deleteGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getMyGroups);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.post("/:groupId/members", protectRoute, addMember);
router.delete("/:groupId/members/:userId", protectRoute, removeMember);
router.put("/:groupId/admin", protectRoute, makeAdmin);
router.put("/:groupId", protectRoute, updateGroup);
router.delete("/:groupId", protectRoute, deleteGroup);

export default router;