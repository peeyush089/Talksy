import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useEffect, useRef, useState } from "react";
import { LogOut, MessageSquare, Settings, User, Bell } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";

/* ─────────────────────────────────────────
   Particle that flies out on logo click
───────────────────────────────────────── */
const COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#eab308"];

const Particle = ({ originX, originY, color }) => {
  const angle = Math.random() * 2 * Math.PI;
  const dist  = 45 + Math.random() * 55;
  const tx    = Math.cos(angle) * dist;
  const ty    = Math.sin(angle) * dist;

  return (
    <motion.div
      style={{
        position: "fixed",
        left: originX - 4,
        top: originY - 4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        pointerEvents: "none",
        zIndex: 9999,
      }}
      initial={{ scale: 1.2, opacity: 1, x: 0, y: 0 }}
      animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
      transition={{ duration: 0.65, ease: [0.2, 0.8, 0.4, 1] }}
    />
  );
};

/* ─────────────────────────────────────────
   Magnetic pull wrapper
───────────────────────────────────────── */
const Magnetic = ({ children, strength = 0.28 }) => {
  const ref = useRef(null);
  const mx  = useMotionValue(0);
  const my  = useMotionValue(0);
  const sx  = useSpring(mx, { stiffness: 180, damping: 14 });
  const sy  = useSpring(my, { stiffness: 180, damping: 14 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: "inline-flex" }}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width  / 2)) * strength);
        my.set((e.clientY - (r.top  + r.height / 2)) * strength);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   One letter of TALKSY
───────────────────────────────────────── */
const SpringLetter = ({ char, delay }) => (
  <motion.span
    style={{ display: "inline-block" }}
    initial={{ y: -30, opacity: 0, rotateX: -90 }}
    animate={{ y: 0,   opacity: 1, rotateX: 0   }}
    transition={{ type: "spring", stiffness: 280, damping: 17, delay }}
    whileHover={{
      y: -6,
      scale: 1.25,
      transition: { type: "spring", stiffness: 500, damping: 10 },
    }}
  >
    {char}
  </motion.span>
);

const LETTERS = "TALKSY".split("");

/* ═════════════════════════════════════════
   Navbar
═════════════════════════════════════════ */
const Navbar = () => {
  const { logout, authUser, socket } = useAuthStore();
  const { friendRequests, getFriendRequests } = useFriendStore();
  const [particles, setParticles] = useState([]);
  const logoRef = useRef(null);

  useEffect(() => { if (authUser) getFriendRequests(); }, [authUser]);

  useEffect(() => {
    if (!socket) return;
    socket.on("friendRequest",         () => getFriendRequests());
    socket.on("friendRequestAccepted", () => getFriendRequests());
    return () => {
      socket.off("friendRequest");
      socket.off("friendRequestAccepted");
    };
  }, [socket]);

  /* Fire particle burst from logo center */
  const burst = () => {
    const r  = logoRef.current?.getBoundingClientRect();
    if (!r) return;
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const fresh = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      originX: cx,
      originY: cy,
      color: COLORS[i % COLORS.length],
    }));
    setParticles((prev) => [...prev, ...fresh]);
    setTimeout(() => setParticles((prev) => prev.slice(fresh.length)), 750);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800;900&display=swap');
        .talksy-word {
          font-family: 'Syne', sans-serif;
          font-weight: 900;
          font-size: 1rem;
          letter-spacing: 0.10em;
          perspective: 500px;
          background: linear-gradient(120deg, oklch(var(--p)), oklch(var(--s)), oklch(var(--a)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200%;
          animation: gradShift 4s ease infinite alternate;
        }
        @media (min-width: 640px) {
          .talksy-word { font-size: 1.22rem; letter-spacing: 0.14em; }
        }
        @keyframes gradShift {
          from { background-position: 0% 50%; }
          to   { background-position: 100% 50%; }
        }
      `}</style>

      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => <Particle key={p.id} {...p} />)}
      </AnimatePresence>

      {/* Header slide-down */}
      <motion.header
        className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80"
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.05 }}
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">

            {/* ── Logo ── */}
            <Link to="/" onClick={burst}>
              <motion.div
                ref={logoRef}
                className="flex items-center gap-3 cursor-pointer"
                whileHover="hov"
                initial="idle"
              >
                {/* Icon box — morphing shape on hover */}
                <Magnetic strength={0.45}>
                  <motion.div
                    style={{
                      width: 34, height: 34,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "oklch(var(--p) / 0.13)",
                      borderRadius: 10,
                      boxShadow: "0 0 0 0 oklch(var(--p) / 0)",
                    }}
                    className="sm:!w-10 sm:!h-10"
                    variants={{
                      idle: { borderRadius: 10, rotate: 0, scale: 1 },
                      hov:  {
                        borderRadius: [10, 22, 6, 20, 10],
                        rotate:       [0, -10, 10, -5, 0],
                        scale: 1.18,
                        boxShadow: "0 0 18px 4px oklch(var(--p) / 0.25)",
                        transition: {
                          borderRadius: { duration: 0.55, ease: "easeInOut" },
                          rotate:       { duration: 0.45, ease: "easeInOut" },
                          scale:        { type: "spring", stiffness: 350 },
                          boxShadow:    { duration: 0.3 },
                        },
                      },
                    }}
                  >
                    <motion.div
                      variants={{
                        idle: { rotate: 0 },
                        hov:  { rotate: [0, -18, 18, -9, 0], transition: { duration: 0.48 } },
                      }}
                    >
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </motion.div>
                  </motion.div>
                </Magnetic>

                {/* Letters */}
                <span className="talksy-word">
                  {LETTERS.map((l, i) => (
                    <SpringLetter key={i} char={l} delay={0.1 + i * 0.055} />
                  ))}
                </span>
              </motion.div>
            </Link>

            {/* ── Right nav ── */}
            <motion.div
              className="flex items-center gap-1 sm:gap-2"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0  }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.38 }}
            >
              {/* Settings — gear spin */}
              <Magnetic>
                <Link to="/settings" className="btn btn-sm gap-1.5 transition-colors px-2 sm:px-3">
                  <motion.span
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", stiffness: 260, damping: 12 }}
                  >
                    <Settings className="w-4 h-4" />
                  </motion.span>
                  <span className="hidden md:inline">Settings</span>
                </Link>
              </Magnetic>

              {authUser && (
                <>
                  {/* Bell — ring animation when requests exist */}
                  <Magnetic>
                    <Link to="/friends" className="btn btn-sm gap-1.5 relative px-2 sm:px-3">
                      <motion.span
                        animate={
                          friendRequests.length > 0
                            ? { rotate: [0, -18, 18, -12, 12, 0] }
                            : {}
                        }
                        transition={{ repeat: Infinity, repeatDelay: 2.5, duration: 0.5 }}
                      >
                        <Bell className="w-4 h-4" />
                      </motion.span>

                      <AnimatePresence>
                        {friendRequests.length > 0 && (
                          <motion.span
                            key="badge"
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-4 flex items-center justify-center"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0   }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 14 }}
                          >
                            {friendRequests.length}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <span className="hidden md:inline">Requests</span>
                    </Link>
                  </Magnetic>

                  <Magnetic>
                    <Link to="/profile" className="btn btn-sm gap-1.5 px-2 sm:px-3">
                      <User className="size-5" />
                      <span className="hidden md:inline">Profile</span>
                    </Link>
                  </Magnetic>

                  <Magnetic>
                    <motion.button
                      className="flex gap-1.5 items-center btn btn-sm btn-ghost px-2 sm:px-3"
                      onClick={logout}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <LogOut className="size-5" />
                      <span className="hidden md:inline">Logout</span>
                    </motion.button>
                  </Magnetic>
                </>
              )}
            </motion.div>

          </div>
        </div>
      </motion.header>
    </>
  );
};
export default Navbar;