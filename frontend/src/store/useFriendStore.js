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
      set({ friends: res.data });
    } catch (error) {
      console.log(error);
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ friendRequests: res.data });
    } catch (error) {
      console.log(error);
    }
  },

  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      console.log(error);
    }
  },

  searchUsers: async (query) => {
    if (!query.trim()) return set({ searchResults: [] });
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/friends/search?query=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      console.log(error);
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