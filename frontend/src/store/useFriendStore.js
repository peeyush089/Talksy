import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useFriendStore = create((set, get) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],      // ✅ track sent requests for "Pending" button
  searchResults: [],
  isSearching: false,

  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/friends/list");
      const friends = Array.isArray(res.data) ? res.data : [];
      set({ friends });
    } catch (error) {
      console.error("Failed to fetch friends:", error.message);
      set({ friends: [] });
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      const friendRequests = Array.isArray(res.data) ? res.data : [];
      set({ friendRequests });
    } catch (error) {
      console.error("Failed to fetch friend requests:", error.message);
      set({ friendRequests: [] });
    }
  },

  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/sent");
      const sentRequests = Array.isArray(res.data) ? res.data : [];
      set({ sentRequests });
    } catch (error) {
      console.error("Failed to fetch sent requests:", error.message);
      set({ sentRequests: [] });
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) return set({ searchResults: [] });
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/friends/search?query=${query}`);
      const searchResults = Array.isArray(res.data) ? res.data : [];
      set({ searchResults });
    } catch (error) {
      console.error("Failed to search users:", error.message);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      await axiosInstance.post(`/friends/send/${userId}`);
      toast.success("Friend request sent!");
      // ✅ add to sentRequests locally so button changes instantly
      set({ sentRequests: [...get().sentRequests, { _id: userId }] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send request");
    }
  },

  acceptFriendRequest: async (userId) => {
    try {
      await axiosInstance.post(`/friends/accept/${userId}`);
      toast.success("Friend request accepted!");
      get().getFriendRequests();
      get().getFriends();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to accept");
    }
  },

  rejectFriendRequest: async (userId) => {
    try {
      await axiosInstance.post(`/friends/reject/${userId}`);
      toast.success("Friend request rejected");
      get().getFriendRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject");
    }
  },
}));