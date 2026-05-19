import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,

  // ================= CHECK AUTH =================
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Check auth error:", error);
      localStorage.removeItem("token");
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ================= SIGNUP =================
  signup: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      localStorage.setItem("token", res.data.token);
      set({ authUser: res.data.user });
      toast.success("Signup successful");
      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Signup failed");
    }
  },

  // ================= LOGIN =================
  login: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      set({ authUser: res.data.user });
      toast.success("Login successful");
      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    }
  },

  // ================= LOGOUT =================
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      localStorage.removeItem("token");
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logout failed");
    }
  },

  // ================= UPDATE PROFILE =================
  updateProfile: async (data) => {
    try {
      set({ isUpdatingProfile: true });
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // ================= SOCKET CONNECT =================
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const token = localStorage.getItem("token");

    const socket = io(SOCKET_URL, {
      query: { userId: authUser._id },
      auth: { token },           // send token to socket too
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  // ================= SOCKET DISCONNECT =================
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    set({ socket: null });
  },
}));