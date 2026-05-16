import { X, Info, Phone, Video } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { zpGlobal } from "../App";
import toast from "react-hot-toast";

const GroupHeader = ({ onInfo }) => {
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();

  if (!selectedGroup) return null;

  const handleGroupCall = (callType) => {
    if (!zpGlobal) {
      toast.error("Call service not ready. Try again.");
      return;
    }

    const callees = selectedGroup.members
      .filter((m) => (m._id || m) !== authUser._id)
      .map((m) => ({
        userID: m._id || m,
        userName: m.fullName || "Member",
      }));

    if (callees.length === 0) {
      toast.error("No other members to call.");
      return;
    }

    zpGlobal.sendCallInvitation({
      callees,
      callType: callType === "video" ? 1 : 0,
      timeout: 60,
    });
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-base-300 bg-base-100 shrink-0">
      {/* Close */}
      <button
        onClick={() => setSelectedGroup(null)}
        className="btn btn-ghost btn-sm btn-circle"
      >
        <X className="size-5" />
      </button>

      {/* Group pic */}
      <div className="relative shrink-0">
        <img
          src={selectedGroup.groupPic || "/avatar.png"}
          alt={selectedGroup.name}
          className="size-10 rounded-full object-cover"
        />
      </div>

      {/* Name + count */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{selectedGroup.name}</p>
        <p className="text-xs text-zinc-400 truncate">
          {selectedGroup.members.length} members
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => handleGroupCall("audio")}
          className="btn btn-ghost btn-sm btn-circle"
          title="Group voice call"
        >
          <Phone className="size-5" />
        </button>
        <button
          onClick={() => handleGroupCall("video")}
          className="btn btn-ghost btn-sm btn-circle"
          title="Group video call"
        >
          <Video className="size-5" />
        </button>
        <button
          onClick={onInfo}
          className="btn btn-ghost btn-sm btn-circle"
          title="Group info"
        >
          <Info className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default GroupHeader;