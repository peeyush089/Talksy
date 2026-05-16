import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const myId = req.user._id;
    if (!query) return res.status(200).json([]);
    const users = await User.find({
      _id: { $ne: myId },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (userId === myId.toString())
      return res.status(400).json({ message: "Cannot send request to yourself" });

    const receiver = await User.findById(userId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    if (receiver.friends.includes(myId))
      return res.status(400).json({ message: "Already friends" });

    if (receiver.friendRequests.includes(myId))
      return res.status(400).json({ message: "Request already sent" });

    receiver.friendRequests.push(myId);
    await receiver.save();

    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("friendRequest", { from: req.user });
    }

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const me = await User.findById(myId);
    const requester = await User.findById(userId);

    if (!me.friendRequests.includes(userId))
      return res.status(400).json({ message: "No friend request from this user" });

    me.friends.push(userId);
    requester.friends.push(myId);
    me.friendRequests = me.friendRequests.filter((id) => id.toString() !== userId);

    await me.save();
    await requester.save();

    const requesterSocketId = getReceiverSocketId(userId);
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("friendRequestAccepted", { by: req.user });
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;
    const me = await User.findById(myId);
    me.friendRequests = me.friendRequests.filter((id) => id.toString() !== userId);
    await me.save();
    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate("friendRequests", "-password");
    res.status(200).json(me.friendRequests);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate("friends", "-password");
    res.status(200).json(me.friends);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ get sent requests
export const getSentRequests = async (req, res) => {
  try {
    const myId = req.user._id;
    // find users who have myId in their friendRequests
    const users = await User.find({ friendRequests: myId }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};