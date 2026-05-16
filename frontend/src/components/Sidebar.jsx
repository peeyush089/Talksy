import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import { Search, Users, UserPlus, Loader, Clock, MessageSquare, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const formatPreviewTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfToday)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (date >= startOfYesterday) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const Sidebar = () => {
  const {
    selectedUser, setSelectedUser,
    unreadCounts, clearUnread,
    subscribeToAllMessages, unsubscribeFromMessages,
    sortedFriends, setSortedFriends,
    lastMessages,
  } = useChatStore();

  const {
    groups, getGroups, selectedGroup, setSelectedGroup,
    groupUnreadCounts, clearGroupUnread, groupLastMessages,
    subscribeToGroupEvents,
  } = useGroupStore();

  const { onlineUsers, authUser } = useAuthStore();

  const {
    friends, getFriends,
    sentRequests, getSentRequests,
    searchResults, searchUsers, isSearching,
    sendFriendRequest,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState("chats");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    getFriends();
    getSentRequests();
    getGroups();
    subscribeToGroupEvents();
  }, []);

  useEffect(() => {
    if (friends.length > 0) {
      setSortedFriends(friends);
      subscribeToAllMessages(friends);
    }
    return () => unsubscribeFromMessages();
  }, [friends]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearchMode(true);
      const timeout = setTimeout(() => searchUsers(searchQuery), 400);
      return () => clearTimeout(timeout);
    } else {
      setIsSearchMode(false);
    }
  }, [searchQuery]);

  const displayFriends = showOnlineOnly
    ? sortedFriends.filter((u) => (onlineUsers || []).includes(u._id))
    : sortedFriends;

  const isFriend = (userId) => friends.some((f) => f._id === userId);
  const isPending = (userId) => sentRequests.some((r) => r._id === userId);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    clearUnread(user._id);
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    clearGroupUnread(group._id);
  };

  const nameRowClass = "flex md:hidden lg:flex flex-1 items-start justify-between min-w-0 gap-2";
  const sidebarClass = `h-full border-r border-base-300 flex flex-col transition-all duration-200 w-full md:w-20 lg:w-80 ${(selectedUser || selectedGroup) ? "hidden md:flex" : "flex"}`;

  const totalChatUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const totalGroupUnread = Object.values(groupUnreadCounts).reduce((a, b) => a + b, 0);

  return (
    <aside className={sidebarClass}>
      {/* Header */}
      <div className="border-b border-base-300 w-full p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-6" />
          <span className="font-semibold text-lg md:hidden lg:block">Messages</span>
        </div>
        <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2">
          <Search className="size-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder={activeTab === "chats" ? "Search users..." : "Search groups..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none w-full md:hidden lg:block"
          />
          {isSearching && <Loader className="size-4 animate-spin text-zinc-400" />}
        </div>
        {!isSearchMode && activeTab === "chats" && (
          <div className="mt-2 flex items-center gap-2 md:hidden lg:flex">
            <label className="cursor-pointer flex items-center gap-2">
              <input type="checkbox" checked={showOnlineOnly} onChange={(e) => setShowOnlineOnly(e.target.checked)} className="checkbox checkbox-xs" />
              <span className="text-xs text-zinc-500">Online only</span>
            </label>
            <span className="text-xs text-zinc-400">({Math.max(0, (onlineUsers || []).length - 1)} online)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-base-300 shrink-0">
        <button
          onClick={() => { setActiveTab("chats"); setSearchQuery(""); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${activeTab === "chats" ? "border-b-2 border-primary text-primary" : "text-zinc-400"}`}
        >
          <MessageSquare className="size-4" />
          <span className="md:hidden lg:inline">Chats</span>
          {totalChatUnread > 0 && (
            <span className="bg-primary text-primary-content text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{totalChatUnread}</span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("groups"); setSearchQuery(""); }}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${activeTab === "groups" ? "border-b-2 border-primary text-primary" : "text-zinc-400"}`}
        >
          <Users className="size-4" />
          <span className="md:hidden lg:inline">Groups</span>
          {totalGroupUnread > 0 && (
            <span className="bg-primary text-primary-content text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">{totalGroupUnread}</span>
          )}
        </button>
      </div>

      <div className="overflow-y-auto w-full flex-1 ">

        {/* ══ CHATS TAB ══ */}
        {activeTab === "chats" && (
          <>
            {isSearchMode ? (
              <>
                <p className="text-xs text-zinc-500 px-4 pt-3 pb-1 md:hidden lg:block">Search Results</p>
                {searchResults.length === 0 && !isSearching && (
                  <p className="text-center text-zinc-500 py-6 text-sm md:hidden lg:block">No users found</p>
                )}
                {searchResults.map((user) => (
                  <div key={user._id} className="w-full px-3 py-2.5 flex items-center gap-1 hover:bg-base-200 transition-colors">
                    <div className="relative shrink-0">
                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-12 object-cover rounded-full" />
                      {(onlineUsers || []).includes(user._id) && (
                        <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                      )}
                    </div>
                    <div className={nameRowClass}>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{user.fullName}</p>
                        <p className="text-xs text-zinc-400 truncate">@{user.username || user.email?.split("@")[0]}</p>
                      </div>
                      {isFriend(user._id) ? (
                        <button onClick={() => handleSelectUser(user)} className="btn btn-xs btn-primary shrink-0">Chat</button>
                      ) : isPending(user._id) ? (
                        <button disabled className="btn btn-xs btn-ghost gap-1 opacity-60 shrink-0"><Clock className="size-3" /> Pending</button>
                      ) : (
                        <button onClick={() => sendFriendRequest(user._id)} className="btn btn-xs btn-outline gap-1 shrink-0"><UserPlus className="size-3" /> Add</button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {displayFriends.length === 0 && (
                  <div className="text-center text-zinc-500 py-12 px-4 md:hidden lg:block">
                    <Users className="size-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No friends yet</p>
                    <p className="text-xs mt-1 text-zinc-400">Search for users to add them</p>
                  </div>
                )}
                {displayFriends.map((user) => {
                  const unread = unreadCounts[user._id] || 0;
                  const isOnline = (onlineUsers || []).includes(user._id);
                  const lastMsg = lastMessages?.[user._id];
                  const isSelected = selectedUser?._id === user._id;
                  let previewText = "Say hi! 👋";
                  if (lastMsg) {
                    if (lastMsg.audio && !lastMsg.text) previewText = "🎤 Voice message";
                    else if (lastMsg.video && !lastMsg.text) previewText = "🎥 Video";
                    else if (lastMsg.image && !lastMsg.text) previewText = "📷 Photo";
                    else if (lastMsg.text) previewText = lastMsg.text;
                    if (lastMsg.senderId === authUser?._id) previewText = `You: ${previewText}`;
                  }
                  return (
                    <button key={user._id} onClick={() => handleSelectUser(user)}
                      className={`w-full px-3 py-2.5 flex items-center gap-1 transition-colors relative ${isSelected ? "bg-base-300" : "hover:bg-base-200"}`}>
                      <div className="relative shrink-0">
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-12 object-cover rounded-full" />
                        {isOnline && <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />}
                      </div>
                      <div className={nameRowClass}>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>{user.fullName}</p>
                          <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-base-content font-medium" : "text-zinc-400"}`}>{previewText}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {lastMsg?.createdAt && <span className={`text-[10px] ${unread > 0 ? "text-primary font-semibold" : "text-zinc-400"}`}>{formatPreviewTime(lastMsg.createdAt)}</span>}
                          {unread > 0 && <span className="bg-primary text-primary-content text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread > 99 ? "99+" : unread}</span>}
                        </div>
                      </div>
                      {unread > 0 && <span className="hidden md:flex lg:hidden absolute top-2 right-2 size-2.5 bg-primary rounded-full" />}
                    </button>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ══ GROUPS TAB ══ */}
        {activeTab === "groups" && (
          <>
            <button onClick={() => setShowCreateGroup(true)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-300">
              <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Plus className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary md:hidden lg:block">New Group</span>
            </button>

            {groups.length === 0 && (
              <div className="text-center text-zinc-500 py-12 px-4 md:hidden lg:block">
                <Users className="size-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No groups yet</p>
                <p className="text-xs mt-1 text-zinc-400">Create a group to get started</p>
              </div>
            )}

            {groups
              .filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((group) => {
                const unread = groupUnreadCounts[group._id] || 0;
                const lastMsg = groupLastMessages?.[group._id];
                const isSelected = selectedGroup?._id === group._id;
                let previewText = "No messages yet";
                if (lastMsg) {
                  const senderIsMe = lastMsg.senderId === authUser?._id;
                  const senderName = senderIsMe ? "You" : (group.members.find((m) => (m._id || m) === lastMsg.senderId)?.fullName?.split(" ")[0] || "");
                  if (lastMsg.audio && !lastMsg.text) previewText = `${senderName}: 🎤 Voice`;
                  else if (lastMsg.video && !lastMsg.text) previewText = `${senderName}: 🎥 Video`;
                  else if (lastMsg.image && !lastMsg.text) previewText = `${senderName}: 📷 Photo`;
                  else if (lastMsg.text) previewText = `${senderName}: ${lastMsg.text}`;
                }
                return (
                  <button key={group._id} onClick={() => handleSelectGroup(group)}
                    className={`w-full px-3 py-2.5 flex items-center gap-1 transition-colors relative ${isSelected ? "bg-base-300" : "hover:bg-base-200"}`}>
                    <div className="relative shrink-0">
                      <img src={group.groupPic || "/avatar.png"} alt={group.name} className="size-12 object-cover rounded-full" />
                    </div>
                    <div className={nameRowClass}>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>{group.name}</p>
                        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-base-content font-medium" : "text-zinc-400"}`}>{previewText}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {lastMsg?.createdAt && <span className={`text-[10px] ${unread > 0 ? "text-primary font-semibold" : "text-zinc-400"}`}>{formatPreviewTime(lastMsg.createdAt)}</span>}
                        {unread > 0 && <span className="bg-primary text-primary-content text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread > 99 ? "99+" : unread}</span>}
                      </div>
                    </div>
                    {unread > 0 && <span className="hidden md:flex lg:hidden absolute top-2 right-2 size-2.5 bg-primary rounded-full" />}
                  </button>
                );
              })}
          </>
        )}
      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </aside>
  );
};

export default Sidebar;