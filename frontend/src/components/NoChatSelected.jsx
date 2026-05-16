// NoChatSelected.jsx — Framer Motion powered, hidden on mobile
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   Typewriter text hook
───────────────────────────────────────── */
const PHRASES = [
  "Start a conversation…",
  "Say hello to someone 👋",
  "Share something fun ✨",
  "Pick a chat and dive in 💬",
];

const useTypewriter = (phrases, speed = 55) => {
  const [displayed, setDisplayed]   = useState("");
  const [phraseIdx, setPhraseIdx]   = useState(0);
  const [charIdx, setCharIdx]       = useState(0);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const delay   = deleting ? speed * 0.5 : speed;

    const t = setTimeout(() => {
      if (!deleting) {
        setDisplayed(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), 1400);
        } else {
          setCharIdx((c) => c + 1);
        }
      } else {
        setDisplayed(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setPhraseIdx((i) => (i + 1) % phrases.length);
          setCharIdx(0);
        } else {
          setCharIdx((c) => c - 1);
        }
      }
    }, delay);

    return () => clearTimeout(t);
  }, [charIdx, deleting, phraseIdx]);

  return displayed;
};

/* ─────────────────────────────────────────
   Floating orb
───────────────────────────────────────── */
const Orb = ({ size, color, x, y, duration, delay }) => (
  <motion.div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(40px)",
      left: x,
      top: y,
      pointerEvents: "none",
      zIndex: 0,
    }}
    animate={{
      x: [0, 18, -12, 20, 0],
      y: [0, -22, 14, -8, 0],
      scale: [1, 1.08, 0.95, 1.04, 1],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

/* ─────────────────────────────────────────
   Tilt card wrapper (mouse-tracking 3-D)
───────────────────────────────────────── */
const TiltCard = ({ children }) => {
  const ref = useRef(null);
  const rx   = useMotionValue(0);
  const ry   = useMotionValue(0);
  const srx  = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry  = useSpring(ry, { stiffness: 120, damping: 18 });

  const rotateX  = useTransform(srx, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY  = useTransform(sry, [-0.5, 0.5], ["-10deg", "10deg"]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        rx.set(((e.clientY - r.top)  / r.height - 0.5));
        ry.set(((e.clientX - r.left) / r.width  - 0.5));
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   Stagger container variants
───────────────────────────────────────── */
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.13, delayChildren: 0.2 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 22 } },
};

/* ═════════════════════════════════════════
   NoChatSelected
═════════════════════════════════════════ */
const NoChatSelected = () => {
  const typed = useTypewriter(PHRASES);

  /* Slide entire panel in from right */
  const panelVariant = {
    hidden: { opacity: 0, x: 80, scale: 0.97 },
    show: {
      opacity: 1, x: 0, scale: 1,
      transition: { type: "spring", stiffness: 220, damping: 26, delay: 0.05 },
    },
  };

  return (
    <motion.div
      className="hidden md:flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50 relative overflow-hidden"
      variants={panelVariant}
      initial="hidden"
      animate="show"
    >
      {/* Background ambient orbs */}
      <Orb size={260} color="oklch(var(--p) / 0.12)" x="10%"  y="15%"  duration={9}  delay={0}   />
      <Orb size={200} color="oklch(var(--s) / 0.10)" x="65%"  y="55%"  duration={11} delay={1.5} />
      <Orb size={160} color="oklch(var(--a) / 0.08)" x="40%"  y="5%"   duration={8}  delay={0.8} />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-md text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Icon with 3-D tilt + morphing glow ring */}
        <motion.div variants={itemUp} className="flex justify-center mb-8">
          <TiltCard>
            <div style={{ position: "relative", display: "inline-flex" }}>
              {/* Pulsing glow ring */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: -14,
                  borderRadius: "50%",
                  border: "2px solid oklch(var(--p) / 0.4)",
                }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                style={{
                  position: "absolute",
                  inset: -24,
                  borderRadius: "50%",
                  border: "1.5px solid oklch(var(--s) / 0.3)",
                }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />

              {/* Main icon box — morphing border-radius */}
              <motion.div
                style={{
                  width: 80, height: 80,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "oklch(var(--p) / 0.13)",
                  borderRadius: 20,
                  boxShadow: "0 12px 40px oklch(var(--p) / 0.2)",
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  borderRadius: [20, 36, 16, 32, 20],
                  rotate: [0, 4, -4, 2, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.12, boxShadow: "0 16px 50px oklch(var(--p) / 0.35)" }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MessageSquare className="w-10 h-10 text-primary" />
                </motion.div>
              </motion.div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Headline */}
        <motion.h2
          variants={itemUp}
          className="text-3xl font-black mb-3"
          style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
        >
          Welcome to{" "}
          <span
            style={{
              background: "linear-gradient(120deg, oklch(var(--p)), oklch(var(--s)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TALKSY
          </span>
        </motion.h2>

        {/* Typewriter subline */}
        <motion.p
          variants={itemUp}
          className="text-base-content/55 text-base mb-6 min-h-[1.6rem]"
        >
          {typed}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, repeatType: "reverse" }}
            style={{ display: "inline-block", marginLeft: 2, fontWeight: 700 }}
          >
            |
          </motion.span>
        </motion.p>

        {/* Three dot loader */}
        <motion.div variants={itemUp} className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: 9, height: 9, borderRadius: "50%",
                background: "oklch(var(--p))",
              }}
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.18,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
export default NoChatSelected;