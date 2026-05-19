import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { ArrowLeft, Check, CheckCheck, Play, Pause } from "lucide-react";
import CallButton from "./CallButton";
import { useState } from "react";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const getDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

// ─── Last Seen helper ─────────────────────────────────────────────────────────

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "Last seen recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return "Last seen just now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen today at ${formatTime(dateStr)}`;
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (date >= startOfYesterday) return `Last seen yesterday at ${formatTime(dateStr)}`;
  return `Last seen ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${formatTime(dateStr)}`;
};

// ─── Date Divider ─────────────────────────────────────────────────────────────

const DateDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-base-300" />
    <span className="text-xs text-zinc-500 font-medium px-2 py-0.5 bg-base-200 rounded-full whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-base-300" />
  </div>
);

// ─── Message Tick ─────────────────────────────────────────────────────────────

const MessageTick = ({ message, authUserId }) => {
  if (message.senderId !== authUserId) return null;
  if (message.seen) return <CheckCheck className="size-3.5 text-blue-400 shrink-0" />;
  if (message.delivered) return <CheckCheck className="size-3.5 text-zinc-400 shrink-0" />;
  return <Check className="size-3.5 text-zinc-400 shrink-0" />;
};

// ─── Audio Message Bubble ─────────────────────────────────────────────────────

const AudioMessage = ({ src, isMine }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const toggle = () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else { audioRef.current?.play(); setPlaying(true); }
  };

  const formatSecs = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl min-w-[180px] max-w-[220px] ${
      isMine ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"
    }`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setTotalDuration(audioRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      />
      <button
        onClick={toggle}
        className={`btn btn-circle btn-xs shrink-0 ${isMine ? "btn-primary-content border border-primary-content/30" : "btn-ghost"}`}
      >
        {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-0.5 flex-1">
        {Array.from({ length: 20 }).map((_, i) => {
          const h = 3 + Math.sin(i * 0.9) * 5 + Math.cos(i * 1.5) * 3;
          const progress = totalDuration ? (currentTime / totalDuration) * 20 : 0;
          return (
            <div
              key={i}
              style={{ height: `${h + 3}px` }}
              className={`w-1 rounded-full transition-colors ${
                i < progress
                  ? isMine ? "bg-primary-content" : "bg-primary"
                  : isMine ? "bg-primary-content/40" : "bg-base-300"
              }`}
            />
          );
        })}
      </div>
      <span className={`text-[10px] shrink-0 ${isMine ? "text-primary-content/70" : "text-zinc-400"}`}>
        {formatSecs(playing ? currentTime : totalDuration)}
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setSelectedUser,
  } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();
  const messageEndRef = useRef(null);
  const isOnline = (onlineUsers || []).includes(selectedUser?._id);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const chatVisibility = "flex";

  // ─── Mobile top bar ────────────────────────────────────────────────────────
  const MobileBar = () => (
    <div className="md:hidden flex items-center gap-3 px-3 py-2 border-b border-base-300 bg-base-100 sticky top-0 z-50">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedUser(null);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedUser(null);
        }}
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Back to contacts"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="relative shrink-0">
        <img
          src={selectedUser.profilePic || "/avatar.png"}
          alt={selectedUser.fullName}
          className="size-9 rounded-full object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{selectedUser.fullName}</p>
        <p className="text-xs text-zinc-400 truncate">
          {isOnline ? "Online" : formatLastSeen(selectedUser.lastSeen)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <CallButton currentUser={authUser} targetUser={selectedUser} callType="audio" />
        <CallButton currentUser={authUser} targetUser={selectedUser} callType="video" />
      </div>
    </div>
  );

  if (isMessagesLoading) {
    return (
      <div className={`flex-1 flex-col h-full overflow-hidden ${chatVisibility}`}>
        <MobileBar />
        <div className="hidden md:block"><ChatHeader /></div>
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // ─── Message Renderer ──────────────────────────────────────────────────────
  const renderMessages = () => {
    const elements = [];
    let lastDate = null;

    messages.forEach((message, idx) => {
      const msgDate = message.createdAt;

      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        elements.push(<DateDivider key={`divider-${idx}`} label={getDateLabel(msgDate)} />);
        lastDate = msgDate;
      }

      const isMine = message.senderId === authUser._id;
      const isLast = idx === messages.length - 1;

      elements.push(
        <div
          key={message._id}
          ref={isLast ? messageEndRef : null}
          className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Avatar */}
          <div className="shrink-0 self-end">
            <img
              src={isMine ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
              alt="avatar"
              className="size-7 rounded-full object-cover"
            />
          </div>

          {/* Bubble */}
          <div className={`flex flex-col max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>

            {/* Voice note */}
            {message.audio ? (
              <AudioMessage src={message.audio} isMine={isMine} />
            ) : (
              <div
                className={`px-3 py-2 rounded-2xl text-sm shadow-sm
                  ${isMine
                    ? "bg-primary text-primary-content rounded-br-sm"
                    : "bg-base-200 text-base-content rounded-bl-sm"
                  }`}
              >
                {/* Image attachment */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="max-w-[200px] rounded-xl mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.image, "_blank")}
                  />
                )}

                {/* Video attachment */}
                {message.video && (
                  <video
                    src={message.video}
                    controls
                    className="max-w-[220px] rounded-xl mb-1"
                    preload="metadata"
                  />
                )}

                {/* Text */}
                {message.text && <p className="leading-relaxed">{message.text}</p>}
              </div>
            )}

            {/* Timestamp + tick */}
            <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
              <span className="text-[10px] text-zinc-400">{formatTime(message.createdAt)}</span>
              <MessageTick message={message} authUserId={authUser._id} />
            </div>
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className={`flex-1 flex-col h-full overflow-hidden ${chatVisibility}`}>
      <MobileBar />
      <div className="hidden md:block"><ChatHeader /></div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 overscroll-x-none" style={{ touchAction: "pan-y" }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400 text-sm">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          renderMessages()
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;