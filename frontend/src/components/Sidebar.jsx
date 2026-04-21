import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  List,
  ClipboardList,
  Users,
  UserCheck,
  ShieldCheck,
  PlusCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

const THEMES = {
  trainer: {
    bg: "linear-gradient(160deg,#0d4f4a 0%,#0f766e 40%,#0d9488 70%,#14b8a6 100%)",
    border: "rgba(255,255,255,0.12)",
    activeBg: "rgba(255,255,255,0.18)",
    activeBorder: "rgba(255,255,255,0.35)",
    activeBar: "linear-gradient(180deg,#ccfbf1,#5eead4)",
    activeIcon: "#ccfbf1",
    activeText: "#ffffff",
    idleIcon: "rgba(255,255,255,0.85)",
    idleText: "rgba(255,255,255,0.75)",
    hoverBg: "rgba(255,255,255,0.18)",
    divider: "rgba(255,255,255,0.15)",
    logoBg: "rgb(240,250,250)",
    avatarBg: "linear-gradient(135deg,#0d4f4a,#14b8a6)",
    logoutHover: "rgba(255,255,255,0.12)",
    textPrimary: "#ffffff",
    textSub: "rgba(255,255,255,0.5)",
    accentLine: "linear-gradient(90deg,#ccfbf1,#5eead4,#14b8a6,transparent)",
  },
  hr: {
    bg: "linear-gradient(160deg,#0c3d5e 0%,#1d6fa4 50%,#38bdf8 100%)",
    border: "rgba(255,255,255,0.15)",
    activeBg: "rgba(255,255,255,0.18)",
    activeBorder: "rgba(255,255,255,0.35)",
    activeBar: "linear-gradient(180deg,#bae6fd,#38bdf8)",
    activeIcon: "#bae6fd",
    activeText: "#ffffff",
    idleIcon: "rgba(255,255,255,0.85)",
    idleText: "rgba(255,255,255,0.75)",
    hoverBg: "rgba(255,255,255,0.12)",
    divider: "rgba(255,255,255,0.15)",
    logoBg: "rgba(255,255,255,0.1)",
    avatarBg: "linear-gradient(135deg,#0c3d5e,#38bdf8)",
    logoutHover: "rgba(255,255,255,0.12)",
    textPrimary: "#ffffff",
    textSub: "rgba(255,255,255,0.6)",
    accentLine: "linear-gradient(90deg,#bae6fd,#38bdf8,#1d6fa4,transparent)",
  },
  manager: {
    bg: "#1a1a2e",
    border: "rgba(249,115,22,0.12)",
    activeBg: "rgba(249,115,22,0.15)",
    activeBorder: "rgba(249,115,22,0.3)",
    activeBar: "linear-gradient(180deg,#fb923c,#f97316)",
    activeIcon: "#f97316",
    activeText: "#ffffff",
    idleIcon: "rgba(255,255,255,0.38)",
    idleText: "rgba(255,255,255,0.45)",
    hoverBg: "rgba(255,255,255,0.05)",
    divider: "rgba(255,255,255,0.07)",
    logoBg: "rgba(255,255,255,0.06)",
    avatarBg: "linear-gradient(135deg,#f97316,#fb923c)",
    logoutHover: "rgba(239,68,68,0.15)",
    textPrimary: "#ffffff",
    textSub: "rgba(255,255,255,0.35)",
    accentLine: "linear-gradient(90deg,#f97316,#fb923c,transparent)",
  },
};

const MENUS = {
  trainer: [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Sprints", path: "/sprints", icon: List },
    { name: "Attendance List", path: "/trainer/attendance", icon: ClipboardList },
  ],
  hr: [
    { name: "HR Dashboard", path: "/hr", icon: LayoutDashboard },
    { name: "Create Sprint", path: "/hr/create-sprint", icon: PlusCircle },
    { name: "Sprints", path: "/hr/sprints", icon: List },
    { name: "Cohorts", path: "/hr/cohorts", icon: Layers },
  ],
  manager: [
    { name: "Dashboard", path: "/manager", icon: LayoutDashboard },
    { name: "Sprints", path: "/manager/sprints", icon: Calendar },
    { name: "Employees", path: "/manager/employees", icon: Users },
    { name: "HR BPs", path: "/manager/hrbp", icon: ShieldCheck },
    { name: "Trainers", path: "/manager/trainers", icon: UserCheck },
  ],
};

const MANAGER_SECTIONS = [
  { label: "Overview", items: ["Dashboard"] },
  { label: "Management", items: ["Sprints"] },
  { label: "People", items: ["Employees", "HR BPs", "Trainers"] },
];

// ── Standalone UserFooter — avatar + name only, no logout ──────
const UserFooter = ({ open, theme, user }) => (
  <div
    style={{
      padding: open ? "12px 10px" : "12px 0",
      borderTop: `1px solid ${theme.divider}`,
      display: "flex",
      alignItems: "center",
      gap: 10,
      justifyContent: open ? "flex-start" : "center",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        minWidth: 34,
        borderRadius: "50%",
        background: theme.avatarBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {user?.initials || "U"}
    </div>
    {open && (
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            color: theme.textPrimary,
            fontSize: 12,
            fontWeight: 700,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.name || "User"}
        </p>
        <p
          style={{
            color: theme.textSub,
            fontSize: 10,
            margin: 0,
            textTransform: "capitalize",
          }}
        >
          {user?.role}
        </p>
      </div>
    )}
  </div>
);

// ── Standalone MenuItem ──────────────────────────────────────────
const MenuItem = ({ item, index, open, theme, role, onCancelClose }) => {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname === item.path;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        to={item.path}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: open ? "9px 10px" : "9px 0",
          justifyContent: open ? "flex-start" : "center",
          borderRadius: 10,
          marginBottom: 2,
          textDecoration: "none",
          position: "relative",
          transition: "background 0.15s",
          background: isActive ? theme.activeBg : "transparent",
          border: isActive
            ? `1px solid ${theme.activeBorder}`
            : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          onCancelClose();
          if (!isActive) e.currentTarget.style.background = theme.hoverBg;
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "20%",
              bottom: "20%",
              width: 3,
              borderRadius: "0 3px 3px 0",
              background: theme.activeBar,
            }}
          />
        )}
        {/* Icon pill — white bg for trainer when collapsed, bright icon when open */}
        <div
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            borderRadius: 8,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              !open && (role === "trainer" || role === "hr")
                ? theme.logoBg
                : "transparent",
            transition: "background 0.2s",
          }}
        >
          <Icon
            size={17}
            style={{
              color: isActive
                ? theme.activeIcon
                : !open && (role === "trainer" || role === "hr")
                  ? role === "hr"
                    ? "#1d6fa4"
                    : "#0d9488"
                  : theme.idleIcon,
              flexShrink: 0,
            }}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? theme.activeText : theme.idleText,
                whiteSpace: "nowrap",
              }}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
};

// ── Sidebar ──────────────────────────────────────────────────────
const Sidebar = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const role = user?.role || "trainer";
  const theme = THEMES[role] || THEMES.trainer;
  const menu = MENUS[role] || MENUS.trainer;
  const isManager = role === "manager";

  const sidebarRef = useRef(null);
  const leaveTimer = useRef(null);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current);
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    const related = e.relatedTarget;
    if (
      related instanceof Node &&
      sidebarRef.current &&
      sidebarRef.current.contains(related)
    )
      return;
    leaveTimer.current = setTimeout(() => setOpen(false), 300);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(leaveTimer.current);
  }, []);

  const footerProps = { open, theme, user };
  const itemProps = { open, theme, role, onCancelClose: cancelClose };

  // ── Manager sidebar ────────────────────────────────────────────
  if (isManager) {
    return (
      <motion.aside
        ref={sidebarRef}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          flexShrink: 0,
          background: theme.bg,
          borderRight: "1px solid rgba(249,115,22,0.1)",
        }}
        animate={{ width: open ? "230px" : "64px" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div
          style={{ height: 2, background: theme.accentLine, flexShrink: 0 }}
        />

        {/* Logo */}
        <div
          style={{
            padding: open ? "16px 14px 12px" : "16px 0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "flex-start" : "center",
            gap: open ? 10 : 0,
            borderBottom: `1px solid ${theme.border}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              borderRadius: 10,
              overflow: "hidden",
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="https://res.cloudinary.com/dgx25btzm/image/upload/v1732010481/72res_zr0pot.png"
              alt="Logo"
              style={{
                width: "120%",
                height: "120%",
                objectFit: "cover",
                objectPosition: "center 20%",
              }}
            />
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <p
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 800,
                    margin: 0,
                    fontFamily: "'Space Grotesk',sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sprint<span style={{ color: "#f97316" }}>Flow</span>
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 10,
                    margin: 0,
                  }}
                >
                  Manager Portal
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sectioned menu */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {MANAGER_SECTIONS.map((section) => {
            const items = menu.filter((m) => section.items.includes(m.name));
            return (
              <div key={section.label} style={{ marginBottom: 8 }}>
                <AnimatePresence>
                  {open && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "4px 10px 6px",
                        margin: 0,
                      }}
                    >
                      {section.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                {items.map((item, i) => (
                  <MenuItem
                    key={item.path}
                    item={item}
                    index={i}
                    {...itemProps}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <UserFooter {...footerProps} />
      </motion.aside>
    );
  }

  // ── Trainer & HR sidebar ───────────────────────────────────────
  return (
    <motion.aside
      ref={sidebarRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        flexShrink: 0,
        background: theme.bg,
        borderRight: `1px solid ${theme.border}`,
      }}
      animate={{ width: open ? "220px" : "68px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div style={{ height: 2, background: theme.accentLine, flexShrink: 0 }} />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "12px 10px 16px",
          borderRadius: 12,
          background: theme.logoBg,
          border: `1px solid ${theme.border}`,
          justifyContent: open ? "flex-start" : "center",
          padding: open ? "8px 10px" : "8px 0",
          gap: open ? 8 : 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src="https://res.cloudinary.com/dgx25btzm/image/upload/v1732010481/72res_zr0pot.png"
            alt="Logo"
            style={{
              width: "120%",
              height: "120%",
              objectFit: "cover",
              objectPosition: "center 20%",
            }}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: 15,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  color:
                    role === "trainer"
                      ? "#0f2827"
                      : role === "hr"
                        ? "#fff"
                        : "#2D5596",
                }}
              >
                Sprint
              </span>
              <span
                style={{
                  color:
                    role === "trainer"
                      ? "#0d9488"
                      : role === "hr"
                        ? "#bae6fd"
                        : "#EB4242",
                }}
              >
                Flow
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {role === "hr" && open && (
        <div style={{ padding: "0 12px 12px", flexShrink: 0 }}>
          <span
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#bae6fd",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            HR Portal
          </span>
        </div>
      )}

      {/* Trainer role badge */}
      {role === "trainer" && open && (
        <div style={{ padding: "0 12px 12px", flexShrink: 0 }}>
          <span
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#ccfbf1",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.25)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Trainer Portal
          </span>
        </div>
      )}

      {/* Menu */}
      <div style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
        {menu.map((item, index) => (
          <MenuItem key={item.path} item={item} index={index} {...itemProps} />
        ))}
      </div>

      <UserFooter {...footerProps} />
    </motion.aside>
  );
};

export default Sidebar;
