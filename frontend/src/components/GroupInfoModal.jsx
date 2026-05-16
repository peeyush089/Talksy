import { useState } from "react";
import { X, Crown, UserMinus, Shield, Trash2, LogOut, UserPlus, Search, Check, Camera } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";

const GroupInfoModal = ({ group, onClose }) => {
  const { authUser } = useAuthStore();
  const { friends } = useFriendStore();
  const { addMember, removeMember, makeAdmin, updateGroup, deleteGroup, leaveGroup } = useGroupStore();

  const isAdmin = group.admin?._id === authUser._id || group.admin === authUser._id;
  const [tab, setTab] = useState("members"); // members | add | edit
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description || "");
  const [editPic, setEditPic] = useState(null);
  const [editPicPreview, setEditPicPreview] = useState(group.groupPic || "");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const memberIds = group.members.map((m) => m._id || m);
  const nonMembers = friends.filter((f) => !memberIds.includes(f._id));

  const filteredMembers = group.members.filter((m) =>
    m.fullName?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNonMembers = nonMembers.filter((f) =>
    f.fullName.toLowerCase().includes(addSearch.toLowerCase())
  );

  const toggleAdd = (id) =>
    setSelectedToAdd((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleAddMembers = async () => {
    setIsLoading(true);
    for (const id of selectedToAdd) {
      await addMember(group._id, id);
    }
    setSelectedToAdd([]);
    setIsLoading(false);
    setTab("members");
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPic(reader.result);
      setEditPicPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateGroup = async () => {
    setIsLoading(true);
    await updateGroup(group._id, { name: editName, description: editDesc, ...(editPic ? { groupPic: editPic } : {}) });
    setIsLoading(false);
    setTab("members");
  };

  const handleDeleteGroup = async () => {
    setIsLoading(true);
    await deleteGroup(group._id);
    setIsLoading(false);
    onClose();
  };

  const handleLeave = async () => {
    setIsLoading(true);
    await leaveGroup(group._id);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 shrink-0">
          <h2 className="font-semibold text-lg">Group Info</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-4" />
          </button>
        </div>

        {/* Group avatar + name */}
        <div className="flex flex-col items-center py-5 border-b border-base-300 shrink-0">
          <div className="relative">
            <img
              src={editPicPreview || "/avatar.png"}
              alt={group.name}
              className="size-20 rounded-full object-cover ring-4 ring-base-300"
            />
            {isAdmin && tab === "edit" && (
              <label className="absolute bottom-0 right-0 btn btn-circle btn-xs btn-primary cursor-pointer">
                <Camera className="size-3" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
              </label>
            )}
          </div>
          <h3 className="font-semibold text-lg mt-2">{group.name}</h3>
          {group.description && (
            <p className="text-xs text-zinc-400 mt-0.5 text-center px-4">{group.description}</p>
          )}
          <p className="text-xs text-zinc-400 mt-1">{group.members.length} members</p>
        </div>

        {/* Tabs (admin only gets edit + add) */}
        <div className="flex border-b border-base-300 shrink-0">
          <button
            onClick={() => setTab("members")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === "members" ? "border-b-2 border-primary text-primary" : "text-zinc-400"}`}
          >
            Members
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setTab("add")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === "add" ? "border-b-2 border-primary text-primary" : "text-zinc-400"}`}
              >
                Add
              </button>
              <button
                onClick={() => setTab("edit")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === "edit" ? "border-b-2 border-primary text-primary" : "text-zinc-400"}`}
              >
                Edit
              </button>
            </>
          )}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 p-4">

          {/* ── Members tab ── */}
          {tab === "members" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2 mb-3">
                <Search className="size-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full"
                />
              </div>
              {filteredMembers.map((member) => {
                const memberId = member._id || member;
                const adminId = group.admin?._id || group.admin;
                const isMemberAdmin = memberId === adminId;
                const isMe = memberId === authUser._id;

                return (
                  <div key={memberId} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-base-200 transition-colors">
                    <div className="relative shrink-0">
                      <img
                        src={member.profilePic || "/avatar.png"}
                        alt={member.fullName}
                        className="size-10 rounded-full object-cover"
                      />
                      {isMemberAdmin && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5">
                          <Crown className="size-2.5 text-yellow-900" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.fullName} {isMe && <span className="text-xs text-zinc-400">(you)</span>}
                      </p>
                      {isMemberAdmin && <p className="text-xs text-yellow-500">Admin</p>}
                    </div>
                    {/* Admin actions on non-admin members */}
                    {isAdmin && !isMe && !isMemberAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => makeAdmin(group._id, memberId)}
                          className="btn btn-ghost btn-xs btn-circle text-yellow-500"
                          title="Make admin"
                        >
                          <Shield className="size-3.5" />
                        </button>
                        <button
                          onClick={() => removeMember(group._id, memberId)}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                          title="Remove"
                        >
                          <UserMinus className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add members tab ── */}
          {tab === "add" && isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2">
                <Search className="size-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search friends to add..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full"
                />
              </div>
              {selectedToAdd.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedToAdd.map((id) => {
                    const user = friends.find((f) => f._id === id);
                    return (
                      <span key={id} className="flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-full">
                        {user?.fullName}
                        <button onClick={() => toggleAdd(id)}><X className="size-3" /></button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="space-y-0.5">
                {filteredNonMembers.length === 0 && (
                  <p className="text-center text-zinc-400 text-sm py-4">All friends are already in the group</p>
                )}
                {filteredNonMembers.map((user) => {
                  const isSelected = selectedToAdd.includes(user._id);
                  return (
                    <button
                      key={user._id}
                      onClick={() => toggleAdd(user._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-base-200"}`}
                    >
                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-9 rounded-full object-cover" />
                      <span className="text-sm flex-1 text-left">{user.fullName}</span>
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-base-300"}`}>
                        {isSelected && <Check className="size-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedToAdd.length > 0 && (
                <button
                  onClick={handleAddMembers}
                  disabled={isLoading}
                  className="btn btn-primary btn-sm w-full rounded-xl"
                >
                  {isLoading ? <span className="loading loading-spinner loading-xs" /> : <UserPlus className="size-4" />}
                  Add {selectedToAdd.length} Member{selectedToAdd.length > 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}

          {/* ── Edit tab ── */}
          {tab === "edit" && isAdmin && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1 block">Group Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm rounded-xl"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1 block">Description</label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm rounded-xl"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={100}
                />
              </div>
              <button
                onClick={handleUpdateGroup}
                disabled={isLoading || !editName.trim()}
                className="btn btn-primary btn-sm w-full rounded-xl"
              >
                {isLoading ? <span className="loading loading-spinner loading-xs" /> : "Save Changes"}
              </button>

              {/* Danger zone */}
              <div className="border border-error/30 rounded-xl p-4 mt-4">
                <p className="text-xs text-error font-semibold uppercase tracking-wider mb-3">Danger Zone</p>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="btn btn-error btn-outline btn-sm w-full rounded-xl gap-2"
                  >
                    <Trash2 className="size-4" /> Delete Group
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-center text-error">Are you sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm flex-1 rounded-xl">Cancel</button>
                      <button onClick={handleDeleteGroup} disabled={isLoading} className="btn btn-error btn-sm flex-1 rounded-xl">
                        {isLoading ? <span className="loading loading-spinner loading-xs" /> : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer - leave group (non-admin) */}
        {!isAdmin && (
          <div className="px-5 py-4 border-t border-base-300 shrink-0">
            <button
              onClick={handleLeave}
              disabled={isLoading}
              className="btn btn-error btn-outline btn-sm w-full rounded-xl gap-2"
            >
              <LogOut className="size-4" /> Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfoModal;