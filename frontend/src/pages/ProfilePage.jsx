import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Pencil, Check, X, AtSign, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Reusable inline-edit field ── */
const EditableField = ({ icon: Icon, label, value, field, onSave, isUpdatingProfile }) => {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(value || "");
  const [saved,   setSaved]     = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === value) { setEditing(false); return; }
    await onSave({ [field]: draft.trim() });
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setDraft(value || "");
    setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="text-sm text-zinc-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2"
          >
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              className="input input-bordered flex-1 focus:outline-primary"
              placeholder={`Enter ${label.toLowerCase()}`}
              disabled={isUpdatingProfile}
            />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleSave}
              className="btn btn-success btn-sm px-3"
              disabled={isUpdatingProfile}
            >
              <Check className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleCancel}
              className="btn btn-ghost btn-sm px-3"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 group"
          >
            <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1 truncate relative">
              {value || <span className="text-zinc-500 italic">Not set</span>}
              {/* Saved flash */}
              <AnimatePresence>
                {saved && (
                  <motion.span
                    key="tick"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-semibold"
                  >
                    ✓ Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </p>
            <motion.button
              whileHover={{ scale: 1.12, rotate: -8 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => { setDraft(value || ""); setEditing(true); }}
              className="btn btn-ghost btn-sm px-3 opacity-40 group-hover:opacity-100 transition-opacity"
              title={`Edit ${label}`}
            >
              <Pencil className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════
   ProfilePage
═══════════════════════════════════════ */
const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const fields = [
    {
      icon: User,
      label: "Full Name",
      field: "fullName",
      value: authUser?.fullName,
    },
    {
      icon: AtSign,
      label: "Username",
      field: "username",
      value: authUser?.username || authUser?.email?.split("@")[0],
    },
    {
      icon: Mail,
      label: "Email Address",
      field: "email",
      value: authUser?.email,
    },
  ];

  return (
    <div className="h-screen pt-20 overflow-y-auto">
      <motion.div
        className="max-w-2xl mx-auto p-4 py-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <div className="bg-base-300 rounded-xl p-6 space-y-8">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Click the <Pencil className="inline w-3 h-3 mx-1" /> pencil to edit any field
            </p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-base-content hover:scale-110
                  p-2 rounded-full cursor-pointer transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}`}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Saving…" : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Editable fields */}
          <motion.div
            className="space-y-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
            }}
          >
            {fields.map(({ icon, label, field, value }) => (
              <motion.div
                key={field}
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 240, damping: 20 } },
                }}
              >
                <EditableField
                  icon={icon}
                  label={label}
                  field={field}
                  value={value}
                  onSave={updateProfile}
                  isUpdatingProfile={isUpdatingProfile}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Account info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6 border border-base-200">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500 flex items-center gap-1">
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="inline-block w-2 h-2 rounded-full bg-green-500"
                  />
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
export default ProfilePage;