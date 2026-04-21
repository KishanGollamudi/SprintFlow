import { useState, useRef, useEffect, useContext, useId } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";
import authService from "@/services/authService";

// â”€â”€ Role config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ROLE_CONFIG = {
  trainer: {
    label:       "Trainer",
    redirect:    "/",
    // Left panel
    panelBg:     "linear-gradient(160deg,#0d4f4a 0%,#0f766e 40%,#0d9488 70%,#14b8a6 100%)",
    dotColor:    "rgba(204,251,241,",   // teal-100 with alpha
    routeColor:  "#5eead4",
    glowColor:   "rgba(45,212,191,0.35)",
    tagline:     "Manage your sprints & track attendance",
    // Right panel / form
    accent:      "#0d9488",
    accentLight: "#f0fafa",
    accentRing:  "rgba(13,148,136,0.25)",
    gradient:    "linear-gradient(135deg,#0d4f4a,#14b8a6)",
    inputFocus:  "#0d9488",
  },
  hr: {
    label:       "HR",
    redirect:    "/hr",
    panelBg:     "linear-gradient(160deg,#0c3d5e 0%,#1d6fa4 50%,#38bdf8 100%)",
    dotColor:    "rgba(186,230,253,",
    routeColor:  "#bae6fd",
    glowColor:   "rgba(56,189,248,0.35)",
    tagline:     "Schedule sprints & manage your team",
    accent:      "#1d6fa4",
    accentLight: "#f0f6ff",
    accentRing:  "rgba(29,111,164,0.25)",
    gradient:    "linear-gradient(135deg,#0c3d5e,#38bdf8)",
    inputFocus:  "#1d6fa4",
  },
  manager: {
    label:       "Manager",
    redirect:    "/manager",
    panelBg:     "linear-gradient(160deg,#000000 0%,#111111 40%,#1a1a1a 70%,#262626 100%)",
    dotColor:    "rgba(255,255,255,",   // white with alpha
    routeColor:  "#ffffff",
    glowColor:   "rgba(255,255,255,0.25)",
    tagline:     "Full oversight of sprints & attendance",
    accent:      "#000000",
    accentLight: "#f3f4f6",
    accentRing:  "rgba(0,0,0,0.12)",
    gradient:    "linear-gradient(135deg,#000000,#262626)",
    inputFocus:  "#000000",
  },
};

const ROLES = ["trainer", "hr", "manager"];

// â”€â”€ Role SVG icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RoleIcon = ({ role, size = 14 }) => {
  if (role === "trainer") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  if (role === "hr") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
};

// â”€â”€ DotMap Canvas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const generateDots = (width, height) => {
  const dots = [];
  const gap  = 14;
  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
      const inMap =
        ((x < width*0.28 && x > width*0.05) && (y < height*0.42 && y > height*0.10)) ||
        ((x < width*0.28 && x > width*0.15) && (y < height*0.82 && y > height*0.42)) ||
        ((x < width*0.48 && x > width*0.30) && (y < height*0.38 && y > height*0.15)) ||
        ((x < width*0.52 && x > width*0.36) && (y < height*0.68 && y > height*0.36)) ||
        ((x < width*0.72 && x > width*0.48) && (y < height*0.52 && y > height*0.10)) ||
        ((x < width*0.82 && x > width*0.68) && (y < height*0.82 && y > height*0.62));
      if (inMap && Math.random() > 0.28)
        dots.push({ x, y, opacity: Math.random() * 0.55 + 0.2 });
    }
  }
  return dots;
};

const DotMap = ({ dotColor, routeColor, glowColor }) => {
  const canvasRef = useRef(null);
  const [dim, setDim] = useState({ width: 0, height: 0 });

  const routes = [
    { sx: 0.18, sy: 0.25, ex: 0.38, ey: 0.18, delay: 0   },
    { sx: 0.38, sy: 0.18, ex: 0.52, ey: 0.30, delay: 2   },
    { sx: 0.10, sy: 0.12, ex: 0.28, ey: 0.55, delay: 1   },
    { sx: 0.60, sy: 0.15, ex: 0.42, ey: 0.48, delay: 0.5 },
    { sx: 0.52, sy: 0.30, ex: 0.68, ey: 0.42, delay: 3   },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDim({ width, height });
      canvas.width  = width;
      canvas.height = height;
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dim.width || !dim.height) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d");
    const dots  = generateDots(dim.width, dim.height);
    let rafId, startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, dim.width, dim.height);

      // dots
      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `${dotColor}${d.opacity})`;
        ctx.fill();
      });

      // animated routes
      const t = (Date.now() - startTime) / 1000;
      routes.forEach(r => {
        const sx = r.sx * dim.width,  sy = r.sy * dim.height;
        const ex = r.ex * dim.width,  ey = r.ey * dim.height;
        const elapsed  = t - r.delay;
        if (elapsed <= 0) return;
        const progress = Math.min(elapsed / 3.5, 1);
        const cx = sx + (ex - sx) * progress;
        const cy = sy + (ey - sy) * progress;

        // line
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy);
        ctx.strokeStyle = routeColor; ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;

        // start dot
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = routeColor; ctx.fill();

        // moving dot + glow
        ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = glowColor; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.fill();

        if (progress === 1) {
          ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fillStyle = routeColor; ctx.fill();
        }
      });

      if (t > 14) startTime = Date.now();
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [dim, dotColor, routeColor, glowColor]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
    </div>
  );
};

// â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Login() {
  const [role, setRole]           = useState("trainer");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate                  = useNavigate();
  const { login }                 = useContext(AuthContext);
  const emailId                   = useId();
  const passwordId                = useId();

  // Forgot password state
  const [showForgot,     setShowForgot]     = useState(false);
  const [forgotEmail,    setForgotEmail]    = useState("");
  const [forgotLoading,  setForgotLoading]  = useState(false);
  const [forgotMsg,      setForgotMsg]      = useState("");
  const [forgotError,    setForgotError]    = useState("");

  const cfg = ROLE_CONFIG[role];

  // Canvas cursor removed (hook deleted)

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError("Enter your email address."); return; }
    setForgotLoading(true); setForgotError(""); setForgotMsg("");
    try {
      await authService.forgotPassword(forgotEmail.trim());
      setForgotMsg("Reset link sent! Check your inbox (and spam folder).");
    } catch (err) {
      setForgotError(err?.message || "Could not send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // In real API mode, login expects (email, password).
      // In mock mode, AuthContext treats the first arg as role.
      const user = await login(
        import.meta.env.VITE_USE_MOCK === "true" ? role : email,
        import.meta.env.VITE_USE_MOCK === "true" ? undefined : password,
      );

      const target =
        user?.role?.toLowerCase() === "hr"
          ? "/hr"
          : user?.role?.toLowerCase() === "manager"
            ? "/manager"
            : "/";

      navigate(target);
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full flex items-center justify-center p-4"
      animate={{ background: cfg.accentLight }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{ position: "relative" }}
    >
      <canvas id="canvas-cursor" className="pointer-events-none fixed inset-0 z-0" style={{ display: 'none' }} />
      <motion.div
        aria-hidden="true"
        animate={{
          background: `radial-gradient(ellipse 75% 55% at 50% 50%, ${cfg.accentRing}, transparent 70%)`,
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-white relative z-10"
        style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)", minHeight: 580 }}
      >

        {/* â”€â”€ LEFT PANEL â”€â”€ */}
        <motion.div
          key={role}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1   }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex w-5/12 relative overflow-hidden flex-col"
          style={{ background: cfg.panelBg }}
        >
          {/* DotMap fills the whole panel */}
          <div className="absolute inset-0">
            <DotMap
              dotColor={cfg.dotColor}
              routeColor={cfg.routeColor}
              glowColor={cfg.glowColor}
            />
          </div>

          {/* Subtle bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{ background: "linear-gradient(to top,rgba(0,0,0,0.25),transparent)" }}
            aria-hidden="true"
          />

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-10 text-center">

            {/* Logo icon */}
            <motion.div
              key={`icon-${role}`}
              initial={{ opacity: 0, y: -16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
              className="mb-5"
            >
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background:    "rgba(255,255,255,0.1)",
                  backdropFilter:"blur(12px)",
                  border:        "2px solid rgba(255,255,255,0.25)",
                  boxShadow:     "0 8px 32px rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="https://res.cloudinary.com/dgx25btzm/image/upload/v1732010481/72res_zr0pot.png"
                  alt="SprintFlow"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 20%", transform: "scale(1.15)" }}
                />
              </div>
            </motion.div>

            {/* Brand name */}
            <motion.h2
              key={`brand-${role}`}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0   }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="text-3xl font-bold text-white mb-2 tracking-tight"
              style={{ fontFamily: "'Space Grotesk',sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
            >
              SprintFlow
            </motion.h2>

            {/* Role badge */}
            <motion.div
              key={`badge-${role}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1   }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
              style={{
                background: "rgba(255,255,255,0.18)",
                border:     "1px solid rgba(255,255,255,0.3)",
                color:      "#ffffff",
                fontSize:   12,
                fontWeight: 600,
              }}
            >
              <RoleIcon role={role} size={12} />
              {cfg.label} Portal
            </motion.div>

            {/* Tagline */}
            <motion.p
              key={`tag-${role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.4 }}
              className="text-sm leading-relaxed max-w-[220px]"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {cfg.tagline}
            </motion.p>
          </div>

        </motion.div>

        {/* â”€â”€ RIGHT PANEL â€” Form â”€â”€ */}
        <div className="w-full md:w-7/12 flex flex-col justify-center px-8 md:px-10 py-10 bg-white">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0  }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >

            {/* Heading */}
            <h1
              className="text-2xl font-bold text-gray-800 mb-1"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="text-sm text-gray-400 mb-7">Sign in to your workspace</p>

            {/* Role toggle */}
            <div
              className="relative flex rounded-xl p-1 mb-6"
              style={{ background: "#f1f5f9" }}
              role="group"
              aria-label="Select role"
            >
              {/* Sliding pill */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg"
                animate={{ left: `calc(4px + ${ROLES.indexOf(role)} * (100% - 8px) / 3)` }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{
                  width:      "calc((100% - 8px) / 3)",
                  background: cfg.gradient,
                  boxShadow:  `0 2px 10px ${cfg.accentRing}`,
                }}
                aria-hidden="true"
              />
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={role === r}
                  onClick={() => setRole(r)}
                  className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold capitalize transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-lg"
                  style={{
                    color:      role === r ? "#fff" : "#64748b",
                    focusRingColor: cfg.accent,
                  }}
                >
                  <span style={{ opacity: role === r ? 1 : 0.55 }}>
                    <RoleIcon role={r} size={13} />
                  </span>
                  {r}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {error && (
                <div
                  className="rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: "rgba(239,68,68,0.35)",
                    background: "rgba(239,68,68,0.06)",
                    color: "#b91c1c",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor={emailId}
                  className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "#d1d5db" }}
                  />
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`${cfg.label.toLowerCase()}@company.com`}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-200 focus:bg-white"
                    onFocus={(e) => { e.target.style.borderColor = cfg.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${cfg.accentRing}`; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb";      e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={passwordId}
                    className="block text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMsg(""); setForgotError(""); }}
                    className="text-xs font-medium transition-opacity duration-150 focus-visible:outline-none focus-visible:underline"
                    style={{ color: cfg.accent }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "#d1d5db" }}
                  />
                  <input
                    id={passwordId}
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-200 focus:bg-white"
                    onFocus={(e) => { e.target.style.borderColor = cfg.inputFocus; e.target.style.boxShadow = `0 0 0 3px ${cfg.accentRing}`; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb";      e.target.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    onClick={() => setShowPwd((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-300 hover:text-gray-500 transition-colors duration-150 focus-visible:outline-none"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.div
                className="pt-1"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full relative overflow-hidden py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
                  style={{
                    background: cfg.gradient,
                    boxShadow:  isHovered
                      ? `0 6px 22px ${cfg.accentRing}`
                      : `0 2px 10px ${cfg.accentRing}`,
                    transition: "box-shadow 0.2s ease, background 0.35s ease",
                    opacity: submitting ? 0.85 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {submitting ? "Signing in…" : `Sign in as ${cfg.label}`}
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>

                  {/* Shimmer on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        aria-hidden="true"
                        initial={{ left: "-100%" }}
                        animate={{ left: "110%"  }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.75, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 w-16 pointer-events-none"
                        style={{
                          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)",
                          filter:     "blur(4px)",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <p className="text-center text-[11px] text-gray-300 mt-6">
              By continuing you agree to SprintFlow's{" "}
              <a href="#" className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-150">Terms</a>
              {" & "}
              <a href="#" className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-150">Privacy</a>
            </p>
          </motion.div>
        </div>
      </motion.div>
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 16 }}
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: "1.5px solid #e5e7eb" }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>Forgot Password?</h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>Enter your email and we'll send a reset link.</p>

              {forgotMsg ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#065f46", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  ✓ {forgotMsg}
                </div>
              ) : (
                <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {forgotError && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#b91c1c", fontSize: 13 }}>
                      {forgotError}
                    </div>
                  )}
                  <div style={{ position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      style={{ width: "100%", paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 13, borderRadius: 12, border: "1.5px solid #e5e7eb", outline: "none", background: "#f9fafb", color: "#111827", boxSizing: "border-box" }}
                      onFocus={(e) => { e.target.style.borderColor = cfg.accent; e.target.style.boxShadow = `0 0 0 3px ${cfg.accentRing}`; }}
                      onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: "11px 0", borderRadius: 12, background: cfg.gradient, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: forgotLoading ? "not-allowed" : "pointer", opacity: forgotLoading ? 0.75 : 1, boxShadow: `0 4px 14px ${cfg.accentRing}` }}
                  >
                    {forgotLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
              )}

              <button
                onClick={() => setShowForgot(false)}
                style={{ marginTop: 16, width: "100%", padding: "9px 0", borderRadius: 12, background: "transparent", color: "#6b7280", fontWeight: 600, fontSize: 13, border: "1.5px solid #e5e7eb", cursor: "pointer" }}
              >
                {forgotMsg ? "Close" : "Cancel"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

