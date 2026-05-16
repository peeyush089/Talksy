import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

// ── helper: move a user to top of friends list ────────────────────────────────
const moveToTop = (list, userId) => {
  const idx = list.findIndex((f) => f._id === userId);
  if (idx <= 0) return list;
  const updated = [...list];
  const [user] = updated.splice(idx, 1);
  return [user, ...updated];
};

// ── helper: extract last message preview fields ───────────────────────────────
const extractLastMsg = (msg) => ({
  text: msg.text,
  image: msg.image,
  video: msg.video,
  audio: msg.audio,
  createdAt: msg.createdAt,
  senderId: msg.senderId,
});

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  lastMessages: {},
  sortedFriends: [],

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const msgs = res.data;
      set({ messages: msgs });

      // update lastMessages from history
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        set((state) => ({
          lastMessages: {
            ...state.lastMessages,
            [userId]: extractLastMsg(last),
          },
        }));
      }

      // clear unread when opening chat
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [userId]: 0 },
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMsg = res.data;

      set((state) => ({
        messages: [...state.messages, newMsg],
        lastMessages: {
          ...state.lastMessages,
          [selectedUser._id]: extractLastMsg(newMsg),
        },
        sortedFriends: moveToTop(state.sortedFriends, selectedUser._id),
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // ── Single named handler so it can be removed precisely ──────────────────
  _onNewMessageInChat: null,
  _onNewMessageGlobal: null,

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove previous in-chat listener if any
    const prev = get()._onNewMessageInChat;
    if (prev) socket.off("newMessage", prev);

    const handler = (newMessage) => {
      // Only append to messages if it's from the currently open chat
      if (newMessage.senderId !== get().selectedUser?._id) return;
      set((state) => ({ messages: [...state.messages, newMessage] }));
    };

    socket.on("newMessage", handler);
    set({ _onNewMessageInChat: handler });
  },

  // ── Global listener: unread badge + preview + move to top ────────────────
  subscribeToAllMessages: (friends) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove previous global listener if any
    const prev = get()._onNewMessageGlobal;
    if (prev) socket.off("newMessage", prev);

    const handler = (newMessage) => {
      const { selectedUser, unreadCounts, sortedFriends, lastMessages } = get();
      const senderId = newMessage.senderId;

      // Increment unread only if this chat is NOT currently open
      const isCurrentChat = selectedUser && selectedUser._id === senderId;
      const newUnread = isCurrentChat
        ? unreadCounts
        : { ...unreadCounts, [senderId]: (unreadCounts[senderId] || 0) + 1 };

      const newLastMessages = {
        ...lastMessages,
        [senderId]: extractLastMsg(newMessage),
      };

      const currentFriends = sortedFriends.length > 0 ? sortedFriends : friends;
      const newSortedFriends = moveToTop(currentFriends, senderId);

      set({
        unreadCounts: newUnread,
        lastMessages: newLastMessages,
        sortedFriends: newSortedFriends,
      });
    };

    socket.on("newMessage", handler);
    set({ _onNewMessageGlobal: handler });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove only the in-chat listener, keep global one alive
    const inChat = get()._onNewMessageInChat;
    if (inChat) {
      socket.off("newMessage", inChat);
      set({ _onNewMessageInChat: null });
    }
  },

  clearUnread: (userId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [userId]: 0 },
    }));
  },

  setSortedFriends: (friends) => set({ sortedFriends: friends }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));