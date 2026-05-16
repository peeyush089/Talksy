import { useState } from "react";
import { X, Search, Check, Users } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useFriendStore } from "../store/useFriendStore";

const CreateGroupModal = ({ onClose }) => {
  const { friends } = useFriendStore();
  const { createGroup } = useGroupStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = friends.filter((f) =>
    f.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    await createGroup({ name, description, memberIds: selectedIds });
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">New Group</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Group name */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1 block">
              Group Name *
            </label>
            <input
              type="text"
              className="input input-bordered w-full input-sm rounded-xl"
              placeholder="e.g. Family, Work Team..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1 block">
              Description (optional)
            </label>
            <input
              type="text"
              className="input input-bordered w-full input-sm rounded-xl"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Member search */}
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1 block">
              Add Members {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
            </label>
            <div className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2 mb-2">
              <Search className="size-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full"
              />
            </div>

            {/* Selected chips */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedIds.map((id) => {
                  const user = friends.find((f) => f._id === id);
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-full"
                    >
                      {user?.fullName}
                      <button onClick={() => toggle(id)} className="hover:text-error">
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Friend list */}
            <div className="max-h-44 overflow-y-auto space-y-0.5 rounded-xl border border-base-300">
              {filtered.length === 0 && (
                <p className="text-center text-zinc-400 text-sm py-4">No friends found</p>
              )}
              {filtered.map((user) => {
                const isSelected = selectedIds.includes(user._id);
                return (
                  <button
                    key={user._id}
                    onClick={() => toggle(user._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors rounded-xl
                      ${isSelected ? "bg-primary/10" : "hover:bg-base-200"}`}
                  >
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-8 rounded-full object-cover shrink-0"
                    />
                    <span className="text-sm flex-1 text-left truncate">{user.fullName}</span>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? "bg-primary border-primary" : "border-base-300"}`}>
                      {isSelected && <Check className="size-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-base-300 flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-ghost btn-sm rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isLoading}
            className="btn btn-primary btn-sm rounded-xl gap-2"
          >
            {isLoading ? <span className="loading loading-spinner loading-xs" /> : <Users className="size-4" />}
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;