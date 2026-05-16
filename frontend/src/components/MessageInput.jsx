import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, Smile, Mic, MicOff, Paperclip, Play, Pause } from "lucide-react";
import toast from "react-hot-toast";

// ─── Emoji Picker (lightweight, no external lib) ──────────────────────────────
const EMOJI_CATEGORIES = {
  "😊 Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐"],
  "👋 Gestures": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄","💋"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☯️","🆚","💯","🔥","✨","⭐","🌟","💫","⚡","🌈","🎉","🎊","🎈","🎁","🏆","🥇","🎯"],
  "🐶 Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🦂","🐢"],
  "🍎 Food": ["🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🥕","🧅","🥔","🍠","🥐","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🍔","🍟","🌭","🍕","🌮","🌯","🥙","🧆","🥚","🍜","🍝","🍛","🍣","🍱","🥟","🦪","🍦","🍰","🎂","🍫","🍬","🍭","🍮","🍯","☕","🧃","🥤","🍵","🧋","🍺","🍻","🥂","🍷"],
  "⚽ Sports": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥅","⛳","🎣","🤿","🎽","🎿","🛷","🥌","🎯","🎱","🔫","🎳","🏋️","🤼","🤸","⛹️","🤺","🏊","🚴","🧘","🏇","🏄","🤽","🚣","🧗","🚵","🏌️"],
  "🚗 Travel": ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍","🛵","🚲","🛴","🛹","🛼","🚁","🛸","✈️","🚀","🛶","⛵","🚤","🛥","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🛳","⛴","🚢","🏖","🏝","🏜","🏕","🏔","🗻","🌋","🏟","🏛","🏗","🏘","🏚","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","🗼","🗽","⛪","🕌","🕍","⛩"],
};

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const categories = Object.keys(EMOJI_CATEGORIES);

  return (
    <div className="absolute bottom-16 left-0 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-72 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Emoji</span>
        <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
          <X className="size-3" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 px-2 pb-1 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 text-base px-1.5 py-0.5 rounded-lg transition-colors ${
              activeCategory === cat ? "bg-primary/20 scale-110" : "hover:bg-base-200"
            }`}
            title={cat}
          >
            {cat.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="px-2 pb-2 h-48 overflow-y-auto">
        <p className="text-[10px] text-base-content/40 uppercase tracking-wider mb-1 px-1">
          {activeCategory.split(" ").slice(1).join(" ")}
        </p>
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-xl p-1 rounded-lg hover:bg-base-200 active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Voice Recorder ───────────────────────────────────────────────────────────
const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
    setAudioBlob(null);
    setAudioURL(null);
    setDuration(0);
    chunksRef.current = [];
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setDuration(0);
  };

  return { isRecording, audioBlob, audioURL, duration, startRecording, stopRecording, cancelRecording, reset };
};

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ─── Audio Preview ────────────────────────────────────────────────────────────
const AudioPreview = ({ url, duration, onCancel }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else { audioRef.current?.play(); setPlaying(true); }
  };

  return (
    <div className="mb-3 flex items-center gap-3 bg-base-200 rounded-xl px-3 py-2">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle} className="btn btn-circle btn-sm btn-primary shrink-0">
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      {/* Waveform bars (decorative) */}
      <div className="flex items-center gap-0.5 flex-1">
        {Array.from({ length: 28 }).map((_, i) => {
          const h = 4 + Math.sin(i * 0.8) * 6 + Math.cos(i * 1.3) * 4;
          const progress = (currentTime / (duration || 1)) * 28;
          return (
            <div
              key={i}
              style={{ height: `${h + 4}px` }}
              className={`w-1 rounded-full transition-colors ${
                i < progress ? "bg-primary" : "bg-base-300"
              }`}
            />
          );
        })}
      </div>
      <span className="text-[10px] text-zinc-400 shrink-0">{formatDuration(duration)}</span>
      <button onClick={onCancel} className="btn btn-ghost btn-xs btn-circle shrink-0">
        <X className="size-3" />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MessageInput = () => {
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null); // { url, type: 'image'|'video', file }
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const { sendMessage } = useChatStore();
  const voice = useVoiceRecorder();

  // Close emoji on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type: isImage ? "image" : "video", file });
  };

  const removeMedia = () => {
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    // Restore cursor position after emoji
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // Send voice note
    if (voice.audioBlob) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await sendMessage({ audio: reader.result });
          voice.reset();
        } catch { console.error("Failed to send voice note"); }
      };
      reader.readAsDataURL(voice.audioBlob);
      return;
    }

    if (!text.trim() && !mediaPreview) return;

    try {
      // Convert media file to base64
      let mediaData = null;
      if (mediaPreview) {
        mediaData = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.onerror = () => rej();
          r.readAsDataURL(mediaPreview.file);
        });
      }

      await sendMessage({
        text: text.trim(),
        image: mediaPreview?.type === "image" ? mediaData : undefined,
        video: mediaPreview?.type === "video" ? mediaData : undefined,
      });

      setText("");
      setMediaPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const canSend = text.trim() || mediaPreview || voice.audioBlob;
  const showVoice = !text.trim() && !mediaPreview && !voice.audioBlob;

  return (
    <div className="p-3 w-full relative">
      {/* Media Preview */}
      {mediaPreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {mediaPreview.type === "image" ? (
              <img
                src={mediaPreview.url}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-xl border border-base-300 shadow-sm"
              />
            ) : (
              <video
                src={mediaPreview.url}
                className="w-20 h-20 object-cover rounded-xl border border-base-300 shadow-sm"
              />
            )}
            <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white rounded px-1 capitalize">
              {mediaPreview.type}
            </span>
            <button
              onClick={removeMedia}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center shadow"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Preview */}
      {voice.audioBlob && !voice.isRecording && (
        <AudioPreview
          url={voice.audioURL}
          duration={voice.duration}
          onCancel={voice.cancelRecording}
        />
      )}

      {/* Main input row */}
      <div className="flex items-center gap-2">
        {/* Emoji toggle */}
        <div ref={emojiRef} className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className={`btn btn-circle btn-sm btn-ghost transition-colors ${
              showEmoji ? "text-warning bg-warning/10" : "text-zinc-400 hover:text-zinc-600"
            }`}
            title="Emoji"
          >
            <Smile className="size-5" />
          </button>
          {showEmoji && (
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
          )}
        </div>

        {/* Media attach (image + video) */}
        {!voice.isRecording && !voice.audioBlob && (
          <>
            <button
              type="button"
              className={`btn btn-circle btn-sm btn-ghost transition-colors ${
                mediaPreview ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-400 hover:text-zinc-600"
              }`}
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or video"
            >
              <Paperclip className="size-5" />
            </button>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </>
        )}

        {/* Text input (hidden while recording) */}
        {!voice.isRecording && !voice.audioBlob && (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 input input-bordered input-sm sm:input-md rounded-xl"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(e)}
          />
        )}

        {/* Recording indicator */}
        {voice.isRecording && (
          <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-error/10 rounded-xl border border-error/20">
            <span className="size-2.5 rounded-full bg-error animate-pulse shrink-0" />
            <span className="text-sm font-mono text-error">{formatDuration(voice.duration)}</span>
            <span className="text-xs text-zinc-400 flex-1">Recording...</span>
            <button
              type="button"
              onClick={voice.cancelRecording}
              className="btn btn-ghost btn-xs text-zinc-400"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Voice / Send button */}
        {showVoice && !voice.isRecording ? (
          <button
            type="button"
            onClick={voice.startRecording}
            className="btn btn-circle btn-sm btn-ghost text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Hold to record voice"
          >
            <Mic className="size-5" />
          </button>
        ) : voice.isRecording ? (
          <button
            type="button"
            onClick={voice.stopRecording}
            className="btn btn-circle btn-sm btn-error animate-pulse"
            title="Stop recording"
          >
            <MicOff className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            onClick={handleSend}
            className="btn btn-circle btn-sm btn-primary transition-transform active:scale-90"
            disabled={!canSend}
            title="Send"
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
