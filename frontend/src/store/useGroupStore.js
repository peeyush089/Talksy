import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const extractLastMsg = (msg) => ({
  text: msg.text,
  image: msg.image,
  video: msg.video,
  audio: msg.audio,
  createdAt: msg.createdAt,
  senderId: msg.senderId?._id || msg.senderId,
  senderName: msg.senderId?.fullName || "",
});

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupMessagesLoading: false,
  isGroupsLoading: false,
  groupUnreadCounts: {},
  groupLastMessages: {},
  _groupMessageHandler: null,
  _groupCreatedHandler: null,
  _groupUpdatedHandler: null,
  _groupDeletedHandler: null,
  _removedFromGroupHandler: null,

  // ── Fetch my groups ───────────────────────────────────────────────────────
  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // ── Create group ──────────────────────────────────────────────────────────
  createGroup: async ({ name, description, memberIds }) => {
    try {
      const res = await axiosInstance.post("/groups", { name, description, memberIds });
      set((state) => ({ groups: [res.data, ...state.groups] }));
      toast.success("Group created!");
      return res.data;
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to create group");
    }
  },

  // ── Select group & load messages ──────────────────────────────────────────
  setSelectedGroup: (group) => set({ selectedGroup: group, groupMessages: [] }),

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });

      // Mark as read
      set((state) => ({
        groupUnreadCounts: { ...state.groupUnreadCounts, [groupId]: 0 },
      }));

      // Update last message
      if (res.data.length > 0) {
        const last = res.data[res.data.length - 1];
        set((state) => ({
          groupLastMessages: { ...state.groupLastMessages, [groupId]: extractLastMsg(last) },
        }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // ── Send message ──────────────────────────────────────────────────────────
  // NOTE: Do NOT add the message to state here.
  // The socket "newGroupMessage" event will fire for everyone including the
  // sender, so we let that handler append the message once — avoiding duplicates.
  sendGroupMessage: async (messageData) => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    try {
      await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to send message");
    }
  },

  // ── Add member ────────────────────────────────────────────────────────────
  addMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { userId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member added!");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add member");
    }
  },

  // ── Remove member ─────────────────────────────────────────────────────────
  removeMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Member removed");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to remove member");
    }
  },

  // ── Make admin ────────────────────────────────────────────────────────────
  makeAdmin: async (groupId, userId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/admin`, { userId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Admin transferred!");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to make admin");
    }
  },

  // ── Update group ──────────────────────────────────────────────────────────
  updateGroup: async (groupId, data) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, data);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      toast.success("Group updated!");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update group");
    }
  },

  // ── Delete group ──────────────────────────────────────────────────────────
  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      toast.success("Group deleted");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete group");
    }
  },

  // ── Leave group ───────────────────────────────────────────────────────────
  leaveGroup: async (groupId) => {
    const authUser = useAuthStore.getState().authUser;
    try {
      await axiosInstance.delete(`/groups/${groupId}/members/${authUser._id}`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      toast.success("Left group");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to leave group");
    }
  },

  // ── Socket subscriptions ──────────────────────────────────────────────────
  subscribeToGroupEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Already subscribed — don't register duplicate listeners
    if (get()._groupMessageHandler) return;

    // New group message
    const onNewGroupMessage = ({ groupId, message }) => {
      const { selectedGroup, groupMessages, groupUnreadCounts, groupLastMessages, groups } = get();
      const isOpen = selectedGroup?._id === groupId;

      set({
        groupMessages: isOpen ? [...groupMessages, message] : groupMessages,
        groupUnreadCounts: {
          ...groupUnreadCounts,
          [groupId]: isOpen ? 0 : (groupUnreadCounts[groupId] || 0) + 1,
        },
        groupLastMessages: {
          ...groupLastMessages,
          [groupId]: extractLastMsg(message),
        },
        groups: moveGroupToTop(groups, groupId),
      });
    };

    // Group created (someone added me)
    const onGroupCreated = (group) => {
      set((state) => {
        const exists = state.groups.find((g) => g._id === group._id);
        return exists ? {} : { groups: [group, ...state.groups] };
      });
    };

    // Group updated
    const onGroupUpdated = (group) => {
      set((state) => ({
        groups: state.groups.map((g) => (g._id === group._id ? group : g)),
        selectedGroup: state.selectedGroup?._id === group._id ? group : state.selectedGroup,
      }));
    };

    // Group deleted
    const onGroupDeleted = ({ groupId }) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      toast("A group was deleted", { icon: "🗑️" });
    };

    // Removed from group
    const onRemovedFromGroup = ({ groupId }) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      toast("You were removed from a group", { icon: "👋" });
    };

    socket.on("newGroupMessage", onNewGroupMessage);
    socket.on("groupCreated", onGroupCreated);
    socket.on("groupUpdated", onGroupUpdated);
    socket.on("groupDeleted", onGroupDeleted);
    socket.on("removedFromGroup", onRemovedFromGroup);

    set({
      _groupMessageHandler: onNewGroupMessage,
      _groupCreatedHandler: onGroupCreated,
      _groupUpdatedHandler: onGroupUpdated,
      _groupDeletedHandler: onGroupDeleted,
      _removedFromGroupHandler: onRemovedFromGroup,
    });
  },

  unsubscribeFromGroupEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    const { _groupMessageHandler, _groupCreatedHandler, _groupUpdatedHandler, _groupDeletedHandler, _removedFromGroupHandler } = get();
    if (_groupMessageHandler) socket.off("newGroupMessage", _groupMessageHandler);
    if (_groupCreatedHandler) socket.off("groupCreated", _groupCreatedHandler);
    if (_groupUpdatedHandler) socket.off("groupUpdated", _groupUpdatedHandler);
    if (_groupDeletedHandler) socket.off("groupDeleted", _groupDeletedHandler);
    if (_removedFromGroupHandler) socket.off("removedFromGroup", _removedFromGroupHandler);
  },

  clearGroupUnread: (groupId) => {
    set((state) => ({
      groupUnreadCounts: { ...state.groupUnreadCounts, [groupId]: 0 },
    }));
  },
}));

const moveGroupToTop = (list, groupId) => {
  const idx = list.findIndex((g) => g._id === groupId);
  if (idx <= 0) return list;
  const updated = [...list];
  const [group] = updated.splice(idx, 1);
  return [group, ...updated];
};