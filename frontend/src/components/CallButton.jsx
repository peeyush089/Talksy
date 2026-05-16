import { Phone, Video } from "lucide-react";
import { zpGlobal } from "../App";
import toast from "react-hot-toast";

const CallButton = ({ currentUser, targetUser, callType }) => {
  const handleCall = () => {
    if (!zpGlobal) {
      toast.error("Call service not ready. Please wait a moment.");
      return;
    }
    zpGlobal.sendCallInvitation({
      callees: [{ userID: targetUser._id, userName: targetUser.fullName }],
      callType: callType === "video" ? 1 : 0,
      timeout: 60,
    });
  };

  return (
    <button
      onClick={handleCall}
      className="btn btn-ghost btn-sm btn-circle"
      title={callType === "video" ? "Video call" : "Audio call"}
    >
      {callType === "video" ? <Video className="size-5" /> : <Phone className="size-5" />}
    </button>
  );
};

export default CallButton;