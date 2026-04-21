import { Bell, LogOut } from "lucide-react";
import { useNavigate }  from "react-router-dom";
import AppBreadcrumb    from "./AppBreadcrumb";
import { useAuth }      from "@/context/AuthContext";
import { useMessengerContext } from "@/context/MessengerContext";

const ROLE_COLORS = {
  trainer: { dot: "bg-teal-500",  badge: "bg-teal-50  text-teal-700  ring-teal-200",   avatarGradient: "linear-gradient(135deg,#0d9488,#14b8a6)" },
  hr:      { dot: "bg-sky-500",  badge: "bg-sky-50  text-sky-700  ring-sky-200",   avatarGradient: "linear-gradient(135deg,#1d6fa4,#38bdf8)"  },
  manager: { dot: "bg-orange-500",badge: "bg-orange-50 text-orange-700 ring-orange-200", avatarGradient: "linear-gradient(135deg,#111827,#374151)"  },
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const role             = user?.role || "trainer";
  const colors           = ROLE_COLORS[role] || ROLE_COLORS.trainer;
  const { totalUnread }  = useMessengerContext() ?? { totalUnread: 0 };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 z-10"
      style={{
        background:     "rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom:   "1px solid rgba(0,0,0,0.06)",
        boxShadow:      "0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
      }}
    >
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-white focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
      >
        Skip to content
      </a>

      <AppBreadcrumb />

      <div className="flex items-center gap-1.5" role="toolbar" aria-label="Header actions">

        {/* Notification bell — click navigates to /chat */}
        <button
          type="button"
          onClick={() => navigate("/chat")}
          aria-label={totalUnread > 0 ? `${totalUnread} unread messages` : "Open messages"}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500 active:scale-95"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          {totalUnread > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 ring-2 ring-white text-white text-[9px] font-bold px-1"
              aria-hidden="true"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />

        {/* User info */}
        {user?.name && (
          <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
            <span className="text-xs font-semibold text-gray-800 tracking-tight">
              {user.name}
            </span>
            <span className={`text-[10px] font-medium capitalize px-1.5 py-0.5 rounded-full ring-1 ${colors.badge}`}>
              {user.role}
            </span>
          </div>
        )}

        {/* Avatar — click to open profile */}
        {user?.initials && (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="View profile"
            title="My Profile"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500"
            style={{ background: colors.avatarGradient }}
          >
            {user.initials}
          </button>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out of SprintFlow"
          title="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-red-400 active:scale-95"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default Header;
