/**
 * ToastContext — Global toast notification system for SprintFlow.
 *
 * Usage:
 *   1. Wrap your app with <ToastProvider> (already done in App.jsx)
 *   2. In any component: const { toast } = useToast();
 *   3. Call: toast.success("Saved!") | toast.error("Failed") | toast.info("Note") | toast.warning("Watch out")
 *
 * Each toast auto-dismisses after `duration` ms (default 3500).
 * Multiple toasts stack vertically in the top-right corner.
 */

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ── Toast type config ─────────────────────────────────────────
const TOAST_CONFIG = {
  success: {
    icon:       CheckCircle,
    bg:         "#f0fdf4",
    border:     "#86efac",
    iconColor:  "#16a34a",
    textColor:  "#15803d",
    barColor:   "#22c55e",
  },
  error: {
    icon:       XCircle,
    bg:         "#fef2f2",
    border:     "#fca5a5",
    iconColor:  "#dc2626",
    textColor:  "#b91c1c",
    barColor:   "#ef4444",
  },
  warning: {
    icon:       AlertTriangle,
    bg:         "#fffbeb",
    border:     "#fcd34d",
    iconColor:  "#d97706",
    textColor:  "#92400e",
    barColor:   "#f59e0b",
  },
  info: {
    icon:       Info,
    bg:         "#eff6ff",
    border:     "#93c5fd",
    iconColor:  "#2563eb",
    textColor:  "#1d4ed8",
    barColor:   "#3b82f6",
  },
};

const DEFAULT_DURATION = 3500;

// ── Context ───────────────────────────────────────────────────
const ToastContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a toast notification.
   * @param {"success"|"error"|"warning"|"info"} type
   * @param {string} message
   * @param {number} [duration=3500] - auto-dismiss delay in ms
   */
  const addToast = useCallback((type, message, duration = DEFAULT_DURATION) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  /** Manually dismiss a toast by id */
  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods — mirrors common toast library APIs
  const toast = {
    success: (msg, duration)  => addToast("success", msg, duration),
    error:   (msg, duration)  => addToast("error",   msg, duration),
    warning: (msg, duration)  => addToast("warning", msg, duration),
    info:    (msg, duration)  => addToast("info",    msg, duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
/**
 * useToast — returns { toast } with methods: success, error, warning, info
 * Must be used inside <ToastProvider>.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Single Toast Item ─────────────────────────────────────────
function ToastItem({ id, type, message, duration, onDismiss }) {
  const cfg  = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position:     "relative",
        display:      "flex",
        alignItems:   "flex-start",
        gap:          10,
        padding:      "12px 14px 14px",
        borderRadius: 12,
        background:   cfg.bg,
        border:       `1.5px solid ${cfg.border}`,
        boxShadow:    "0 4px 20px rgba(0,0,0,0.10)",
        minWidth:     280,
        maxWidth:     380,
        overflow:     "hidden",
        cursor:       "default",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Colored left accent bar */}
      <div style={{
        position:     "absolute",
        left:         0, top: 0, bottom: 0,
        width:        3,
        background:   cfg.barColor,
        borderRadius: "12px 0 0 12px",
      }} />

      {/* Icon */}
      <Icon size={17} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }} />

      {/* Message */}
      <p style={{
        flex:       1,
        margin:     0,
        fontSize:   13,
        fontWeight: 600,
        color:      cfg.textColor,
        lineHeight: 1.45,
      }}>
        {message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        style={{
          background:  "transparent",
          border:      "none",
          cursor:      "pointer",
          padding:     2,
          color:       cfg.iconColor,
          opacity:     0.6,
          flexShrink:  0,
          display:     "flex",
          alignItems:  "center",
          borderRadius: 4,
          transition:  "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        <X size={13} />
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        style={{
          position:       "absolute",
          bottom:         0, left: 0, right: 0,
          height:         2,
          background:     cfg.barColor,
          transformOrigin: "left",
          opacity:        0.5,
        }}
      />
    </motion.div>
  );
}

// ── Toast Container — renders all active toasts ───────────────
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    // Fixed top-right stack, above all modals (z-index 9999)
    <div
      style={{
        position:      "fixed",
        top:           20,
        right:         20,
        zIndex:        9999,
        display:       "flex",
        flexDirection: "column",
        gap:           10,
        pointerEvents: "none", // container doesn't block clicks
      }}
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          // Each toast re-enables pointer events
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem {...t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
