import { useEffect, useRef, useState } from "react";
import { X, Info, Crown, Phone, Video } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import GroupInfoModal from "./GroupInfoModal";
import { zpGlobal } from "../App";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

const getDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
};

const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const DateDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-base-300" />
    <span className="text-xs text-zinc-500 font-medium px-2 py-0.5 bg-base-200 rounded-full whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-base-300" />
  </div>
);

// ── Audio bubble ──────────────────────────────────────────────────────────────
const AudioBubble = ({ src, isMine }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else { audioRef.current?.play(); setPlaying(true); }
  };
  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl min-w-[160px] ${isMine ? "bg-primary text-primary-content" : "bg-base-200"}`}>
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      />
      <button onClick={toggle} className={`btn btn-circle btn-xs ${isMine ? "btn-ghost border border-primary-content/30" : "btn-ghost"}`}>
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex items-center gap-0.5 flex-1">
        {Array.from({ length: 18 }).map((_, i) => {
          const h = 3 + Math.sin(i * 0.9) * 5 + Math.cos(i * 1.5) * 3;
          const progress = duration ? (currentTime / duration) * 18 : 0;
          return <div key={i} style={{ height: `${h + 3}px` }} className={`w-1 rounded-full ${i < progress ? (isMine ? "bg-primary-content" : "bg-primary") : (isMine ? "bg-primary-content/40" : "bg-base-300")}`} />;
        })}
      </div>
      <span className={`text-[10px] shrink-0 ${isMine ? "text-primary-content/70" : "text-zinc-400"}`}>{fmt(playing ? currentTime : duration)}</span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const GroupContainer = () => {
  const { selectedGroup, groupMessages, getGroupMessages, isGroupMessagesLoading, sendGroupMessage, setSelectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (selectedGroup?._id) getGroupMessages(selectedGroup._id);
  }, [selectedGroup?._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  if (!selectedGroup) return null;

  const adminId = selectedGroup.admin?._id || selectedGroup.admin;

  // ── Group call handler ──────────────────────────────────────────────────────
  const handleGroupCall = (callType) => {
    if (!zpGlobal) {
      toast.error("Call service not ready. Try again.");
      return;
    }
    const callees = selectedGroup.members
      .filter((m) => (m._id || m) !== authUser._id)
      .map((m) => ({ userID: m._id || m, userName: m.fullName || "Member" }));

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

  const renderMessages = () => {
    const elements = [];
    let lastDate = null;

    groupMessages.forEach((message, idx) => {
      const msgDate = message.createdAt;
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        elements.push(<DateDivider key={`d-${idx}`} label={getDateLabel(msgDate)} />);
        lastDate = msgDate;
      }
      const sender = message.senderId;
      const senderId = sender?._id || sender;
      const isMine = senderId === authUser._id;
      const isLast = idx === groupMessages.length - 1;
      const senderIsAdmin = senderId === adminId;

      elements.push(
        <div key={message._id} ref={isLast ? messageEndRef : null} className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          <div className="shrink-0 self-end">
            <img src={sender?.profilePic || "/avatar.png"} alt={sender?.fullName} className="size-7 rounded-full object-cover" />
          </div>
          <div className={`flex flex-col max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
            {!isMine && (
              <div className="flex items-center gap-1 mb-0.5 px-1">
                <span className="text-xs font-semibold text-primary truncate">{sender?.fullName}</span>
                {senderIsAdmin && <Crown className="size-3 text-yellow-500 shrink-0" />}
              </div>
            )}
            {message.audio ? (
              <AudioBubble src={message.audio} isMine={isMine} />
            ) : (
              <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${isMine ? "bg-primary text-primary-content rounded-br-sm" : "bg-base-200 text-base-content rounded-bl-sm"}`}>
                {message.image && <img src={message.image} alt="Attachment" className="max-w-[200px] rounded-xl mb-1 cursor-pointer hover:opacity-90" onClick={() => window.open(message.image, "_blank")} />}
                {message.video && <video src={message.video} controls className="max-w-[220px] rounded-xl mb-1" preload="metadata" />}
                {message.text && <p className="leading-relaxed">{message.text}</p>}
              </div>
            )}
            <span className="text-[10px] text-zinc-400 mt-0.5 px-1">{formatTime(message.createdAt)}</span>
          </div>
        </div>
      );
    });
    return elements;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-base-300 bg-base-100 shrink-0 w-full">
        {/* Close */}
        <button onClick={() => setSelectedGroup(null)} className="btn btn-ghost btn-sm btn-circle">
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
          <p className="text-xs text-zinc-400 truncate">{selectedGroup.members.length} members</p>
        </div>

        {/* Call + info buttons */}
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
            onClick={() => setShowInfo(true)}
            className="btn btn-ghost btn-sm btn-circle"
            title="Group info"
          >
            <Info className="size-5" />
          </button>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isGroupMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : groupMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400 text-sm">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          renderMessages()
        )}
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <GroupMessageInput />

      {/* ── Info modal ─────────────────────────────────────────────────────── */}
      {showInfo && <GroupInfoModal group={selectedGroup} onClose={() => setShowInfo(false)} />}
    </div>
  );
};

// ── Group Message Input ───────────────────────────────────────────────────────
const GroupMessageInput = () => {
  const { sendGroupMessage } = useGroupStore();
  return <_GroupInput onSend={sendGroupMessage} />;
};

const _GroupInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return;
    setMediaPreview({ url: URL.createObjectURL(file), type: isImage ? "image" : "video", file });
  };

  const removeMedia = () => { setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !mediaPreview) return;
    let mediaData = null;
    if (mediaPreview) {
      mediaData = await new Promise((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.readAsDataURL(mediaPreview.file);
      });
    }
    await onSend({
      text: text.trim(),
      image: mediaPreview?.type === "image" ? mediaData : undefined,
      video: mediaPreview?.type === "video" ? mediaData : undefined,
    });
    setText("");
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-3 w-full border-t border-base-300 shrink-0">
      {mediaPreview && (
        <div className="mb-2 relative inline-block">
          {mediaPreview.type === "image"
            ? <img src={mediaPreview.url} className="w-16 h-16 object-cover rounded-xl border border-base-300" />
            : <video src={mediaPreview.url} className="w-16 h-16 object-cover rounded-xl border border-base-300" />}
          <button onClick={removeMedia} className="absolute -top-1.5 -right-1.5 btn btn-circle btn-xs bg-base-300">✕</button>
        </div>
      )}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFile} />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-ghost btn-circle btn-sm text-zinc-400">
          📎
        </button>
        <input
          type="text"
          className="flex-1 input input-bordered input-sm rounded-xl"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(e)}
        />
        <button type="submit" disabled={!text.trim() && !mediaPreview} className="btn btn-primary btn-circle btn-sm">
          ➤
        </button>
      </form>
    </div>
  );
};

export default GroupContainer;