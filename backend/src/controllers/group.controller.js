import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

// ── Create Group ──────────────────────────────────────────────────────────────
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name?.trim()) return res.status(400).json({ error: "Group name is required" });

    // Always include admin in members
    const members = [...new Set([adminId.toString(), ...(memberIds || [])])];

    const group = new Group({ name, description, admin: adminId, members });
    await group.save();

    const populated = await Group.findById(group._id)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic username");

    // Notify all members via socket
    members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupCreated", populated);
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get My Groups ─────────────────────────────────────────────────────────────
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId })
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic username")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Get Group Messages ────────────────────────────────────────────────────────
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.members.map(String).includes(userId.toString())) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Send Group Message ────────────────────────────────────────────────────────
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image, video, audio } = req.body;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.members.map(String).includes(senderId.toString())) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    let imageUrl, videoUrl, audioUrl;

    if (image) {
      const res = await cloudinary.uploader.upload(image, { resource_type: "image" });
      imageUrl = res.secure_url;
    }
    if (video) {
      const res = await cloudinary.uploader.upload(video, { resource_type: "video" });
      videoUrl = res.secure_url;
    }
    if (audio) {
      const res = await cloudinary.uploader.upload(audio, { resource_type: "video", folder: "audio_messages" });
      audioUrl = res.secure_url;
    }

    const message = new GroupMessage({
      groupId,
      senderId,
      text,
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      seenBy: [senderId],
    });

    await message.save();

    const populated = await GroupMessage.findById(message._id)
      .populate("senderId", "fullName profilePic");

    // Update group's updatedAt so it sorts to top
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    // Emit to all group members
    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("newGroupMessage", { groupId, message: populated });
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Add Member (admin only) ───────────────────────────────────────────────────
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: "Only admin can add members" });
    }
    if (group.members.map(String).includes(userId)) {
      return res.status(400).json({ error: "User already in group" });
    }

    group.members.push(userId);
    await group.save();

    const populated = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic username");

    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupUpdated", populated);
    });
    io.to(`user_${userId}`).emit("groupCreated", populated);

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in addMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Remove Member (admin only, or self-leave) ─────────────────────────────────
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isSelf = requesterId.toString() === userId;
    const isAdmin = group.admin.toString() === requesterId.toString();

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: "Only admin can remove members" });
    }
    if (isAdmin && isSelf) {
      return res.status(400).json({ error: "Admin cannot leave. Transfer admin or delete the group." });
    }

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    const populated = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic username");

    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupUpdated", populated);
    });
    io.to(`user_${userId}`).emit("removedFromGroup", { groupId });

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in removeMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Make Admin ────────────────────────────────────────────────────────────────
export const makeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: "Only admin can transfer admin role" });
    }

    group.admin = userId;
    await group.save();

    const populated = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic username");

    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupUpdated", populated);
    });

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in makeAdmin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Update Group (admin only) ─────────────────────────────────────────────────
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, groupPic } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: "Only admin can update group" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (groupPic) {
      const uploaded = await cloudinary.uploader.upload(groupPic, { resource_type: "image" });
      group.groupPic = uploaded.secure_url;
    }

    await group.save();

    const populated = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic username");

    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupUpdated", populated);
    });

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in updateGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Delete Group (admin only) ─────────────────────────────────────────────────
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: "Only admin can delete group" });
    }

    const memberIds = [...group.members];
    await GroupMessage.deleteMany({ groupId });
    await Group.findByIdAndDelete(groupId);

    memberIds.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupDeleted", { groupId });
    });

    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    console.error("Error in deleteGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};