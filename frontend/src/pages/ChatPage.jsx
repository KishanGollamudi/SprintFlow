// src/pages/ChatPage.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Search, MessageSquare, Wifi, WifiOff, Smile, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMessengerContext } from "@/context/MessengerContext";
import { STATUS_OPTIONS, statusColor } from "@/hooks/useMessenger";

// ── Constants ─────────────────────────────────────────────────
const ROLE_COLOR = { MANAGER: "#6366f1", HR: "#D45769", TRAINER: "#0d9488" };
const rc = (r) => ROLE_COLOR[r?.toUpperCase()] ?? "#6b7280";

const EMOJIS = ["😊","😂","👍","❤️","🔥","🎉","👏","😎","🤔","😅",
                "✅","🚀","💡","📌","⚡","🙏","😢","😡","🤝","💪"];

// ── Helpers ───────────────────────────────────────────────────
function Avatar({ name, email, role, size = 38, status }) {
  const initials = (name ?? email ?? "?").slice(0, 2).toUpperCase();
  const color    = rc(role);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: size * 0.32, fontWeight: 700,
        boxShadow: `0 2px 8px ${color}44`,
      }}>
        {initials}
      </div>
      {status && (
        <span style={{
          position: "absolute", bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: "50%",
          background: statusColor(status),
          border: "2px solid #fff",
        }} />
      )}
    </div>
  );
}

function StatusDot({ status, size = 8 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: "50%", background: statusColor(status), flexShrink: 0,
    }} />
  );
}

// ── Main component ────────────────────────────────────────────
export default function ChatPage() {
  const { email: paramEmail } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    connected, conversations, contacts, presence,
    myStatus, updateMyStatus,
    unread, send, loadHistory, searchUsers, markRead,
  } = useMessengerContext();

  const [activeEmail, setActiveEmail]   = useState(paramEmail ?? null);
  const [text, setText]                 = useState("");
  const [search, setSearch]             = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [showStatus, setShowStatus]     = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const searchTimer = useRef(null);

  // Sync URL param
  useEffect(() => {
    if (paramEmail) {
      const key = paramEmail.toLowerCase();
      if (key !== activeEmail) setActiveEmail(key);
    }
  }, [paramEmail]);

  // Load history + mark read when chat changes
  useEffect(() => {
    if (!activeEmail) return;
    loadHistory(activeEmail);
    markRead(activeEmail);
    setShowEmoji(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmail]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeEmail]);

  // Dynamic search with debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (search.trim().length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      searchUsers(search).then((res) => { setSearchResults(res); setSearching(false); });
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search, searchUsers]);

  const messages      = activeEmail ? (conversations[activeEmail] ?? []) : [];
  const activeContact = contacts.find((c) => (c.email ?? "").toLowerCase() === activeEmail)
    ?? searchResults.find((c) => (c.email ?? "").toLowerCase() === activeEmail);
  const activeStatus  = presence[activeEmail] ?? activeContact?.status ?? "offline";

  // Sidebar list: chat-history contacts + search results merged
  const sidebarList = useMemo(() => {
    if (search.trim().length >= 2) {
      // Show search results, mark which ones are already contacts
      return searchResults.map((r) => ({
        ...r,
        status: presence[r.email] ?? r.status ?? "offline",
        isNew: !contacts.some((c) => (c.email ?? "").toLowerCase() === (r.email ?? "").toLowerCase()),
      }));
    }
    // Default: only chat-history contacts
    return contacts.map((c) => ({
      ...c,
      status: presence[c.email] ?? c.status ?? "offline",
      isNew: false,
    }));
  }, [search, searchResults, contacts, presence]);

  const openChat = (email) => {
    const key = (email ?? "").toLowerCase();
    setActiveEmail(key);
    setSearch("");
    setSearchResults([]);
    navigate(`/chat/${key}`, { replace: true });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !activeEmail) return;
    send(activeEmail, trimmed);
    setText("");
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertEmoji = (emoji) => {
    setText((t) => t + emoji);
    inputRef.current?.focus();
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg) => {
      const d = msg.sentAt ? new Date(msg.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
      if (d !== lastDate) { groups.push({ type: "date", label: d }); lastDate = d; }
      groups.push({ type: "msg", msg });
    });
    return groups;
  }, [messages]);

  const myStatusOption = STATUS_OPTIONS.find((o) => o.value === myStatus) ?? STATUS_OPTIONS[0];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", background: "#f0f2f5", fontFamily: "inherit" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <div style={{
        width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
        background: "#fff", borderRight: "1px solid #e5e7eb",
        boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
      }}>

        {/* Sidebar top — my profile + status */}
        <div style={{
          padding: "14px 16px 10px",
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={user?.name} email={user?.email} role={user?.role} size={40} status={myStatus} />
              <div>
                <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 14 }}>{user?.name ?? user?.email}</p>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 11 }}>{user?.role}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {connected
                ? <Wifi size={13} color="#10b981" title="Connected" />
                : <WifiOff size={13} color="#ef4444" title="Disconnected" />}
            </div>
          </div>

          {/* My status selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowStatus((v) => !v)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 600,
              }}
            >
              <StatusDot status={myStatus} />
              {myStatusOption.label}
              <ChevronDown size={12} style={{ marginLeft: "auto", opacity: 0.7 }} />
            </button>
            <AnimatePresence>
              {showStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                    background: "#1e293b", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button key={opt.value}
                      onClick={() => { updateMyStatus(opt.value); setShowStatus(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 12px", background: myStatus === opt.value ? "rgba(255,255,255,0.1)" : "transparent",
                        border: "none", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 600,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = myStatus === opt.value ? "rgba(255,255,255,0.1)" : "transparent"}
                    >
                      <StatusDot status={opt.value} />
                      {opt.label}
                      {myStatus === opt.value && <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start new chat…"
              style={{
                width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                fontSize: 13, borderRadius: 20, border: "1px solid #e5e7eb",
                outline: "none", background: "#f9fafb", color: "#111827", boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e)  => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
          {search.trim().length >= 2 && (
            <p style={{ margin: "4px 4px 0", fontSize: 10, color: "#9ca3af" }}>
              {searching ? "Searching…" : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sidebarList.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <MessageSquare size={28} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
              <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
                {search.trim().length >= 2 ? "No users found" : "No conversations yet."}
              </p>
              {search.trim().length < 2 && (
                <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>Search to start chatting.</p>
              )}
            </div>
          )}
          {sidebarList.map((c) => {
            const isActive  = (c.email ?? "").toLowerCase() === activeEmail;
            const unreadCnt = unread[c.email] ?? 0;
            const lastMsg   = (conversations[c.email] ?? []).slice(-1)[0];
            return (
              <button key={c.email} onClick={() => openChat(c.email)}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 14px",
                  background: isActive ? "#eff6ff" : "transparent",
                  borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <Avatar name={c.name} email={c.email} role={c.role} size={42} status={c.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name ?? c.email}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {lastMsg && (
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>
                          {new Date(lastMsg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {unreadCnt > 0 && (
                        <span style={{ background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>
                          {unreadCnt}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: rc(c.role), fontWeight: 600 }}>{c.role}</span>
                    <span style={{ color: "#d1d5db", fontSize: 10 }}>·</span>
                    <StatusDot status={c.status} size={6} />
                    <span style={{ fontSize: 10, color: statusColor(c.status) }}>
                      {STATUS_OPTIONS.find((o) => o.value === c.status)?.label ?? "Offline"}
                    </span>
                    {c.isNew && <span style={{ marginLeft: 4, fontSize: 9, background: "#6366f1", color: "#fff", borderRadius: 4, padding: "1px 5px" }}>NEW</span>}
                  </div>
                  {lastMsg && (
                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lastMsg.senderEmail === (user?.email ?? "").toLowerCase() ? "You: " : ""}{lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ CHAT AREA ════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeEmail ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#f0f2f5" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={36} color="#9ca3af" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#374151", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>SprintFlow Messenger</p>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Select a conversation or search to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: "12px 20px", background: "#fff",
              borderBottom: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <Avatar name={activeContact?.name} email={activeEmail} role={activeContact?.role} size={40} status={activeStatus} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  {activeContact?.name ?? activeEmail}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status={activeStatus} size={7} />
                  <span style={{ fontSize: 11, color: statusColor(activeStatus), fontWeight: 600 }}>
                    {STATUS_OPTIONS.find((o) => o.value === activeStatus)?.label ?? "Offline"}
                  </span>
                  <span style={{ color: "#d1d5db", fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 11, color: rc(activeContact?.role) }}>{activeContact?.role}</span>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "20px 24px",
              display: "flex", flexDirection: "column", gap: 2,
              background: "#f0f2f5",
              backgroundImage: "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}>
              <AnimatePresence initial={false}>
                {groupedMessages.map((item, i) => {
                  if (item.type === "date") {
                    return (
                      <div key={`date-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 8px" }}>
                        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, background: "#f0f2f5", padding: "2px 10px", borderRadius: 20, border: "1px solid #e5e7eb" }}>
                          {item.label}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                      </div>
                    );
                  }
                  const { msg } = item;
                  const isOwn = msg.senderEmail === (user?.email ?? "").toLowerCase();
                  const color = rc(isOwn ? user?.role : msg.senderRole);
                  return (
                    <motion.div key={msg.id ?? i}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        alignSelf: isOwn ? "flex-end" : "flex-start",
                        maxWidth: "65%", marginBottom: 4,
                        display: "flex", flexDirection: "column",
                        alignItems: isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      {!isOwn && (
                        <span style={{ fontSize: 10, color, fontWeight: 700, margin: "0 0 3px 12px" }}>
                          {msg.senderName ?? msg.senderEmail}
                        </span>
                      )}
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isOwn
                          ? `linear-gradient(135deg, ${color}, ${color}dd)`
                          : "#fff",
                        color: isOwn ? "#fff" : "#111827",
                        fontSize: 13.5, lineHeight: 1.5,
                        boxShadow: isOwn
                          ? `0 2px 8px ${color}44`
                          : "0 1px 4px rgba(0,0,0,0.08)",
                        wordBreak: "break-word",
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 10, color: "#9ca3af", margin: "3px 6px 0" }}>
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        {isOwn && (
                          <span style={{ marginLeft: 4 }}>
                            {msg._optimistic ? (
                              // Sending — single grey tick
                              <span style={{ color: "#9ca3af" }}>✓</span>
                            ) : msg.readAt ? (
                              // Seen — double blue tick
                              <span style={{ color: "#3b82f6" }} title={`Seen ${new Date(msg.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}>✓✓</span>
                            ) : msg.delivered ? (
                              // Delivered — double grey tick
                              <span style={{ color: "#9ca3af" }} title="Delivered">✓✓</span>
                            ) : (
                              // Sent to server — single grey tick
                              <span style={{ color: "#9ca3af" }}>✓</span>
                            )}
                          </span>
                        )}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "10px 16px" }}>
              {/* Emoji picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    style={{
                      display: "flex", flexWrap: "wrap", gap: 4, padding: "10px 12px",
                      background: "#f9fafb", borderRadius: 12, marginBottom: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => insertEmoji(e)}
                        style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 6, lineHeight: 1 }}
                        onMouseEnter={(el) => el.currentTarget.style.background = "#e5e7eb"}
                        onMouseLeave={(el) => el.currentTarget.style.background = "none"}
                      >{e}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                {/* Emoji toggle */}
                <button onClick={() => setShowEmoji((v) => !v)}
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: "1px solid #e5e7eb",
                    background: showEmoji ? "#f0f2f5" : "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                  <Smile size={18} color={showEmoji ? "#6366f1" : "#9ca3af"} />
                </button>

                {/* Text input */}
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={connected ? "Type a message…" : "Sending via server (WebSocket reconnecting)…"}
                  rows={1}
                  style={{
                    flex: 1, resize: "none", fontSize: 13.5, padding: "9px 14px",
                    borderRadius: 22, border: "1px solid #e5e7eb", outline: "none",
                    fontFamily: "inherit", background: "#f9fafb",
                    color: "#111827", lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                  onBlur={(e)  => e.target.style.borderColor = "#e5e7eb"}
                />

                {/* Send button */}
                <button onClick={handleSend}
                  disabled={!text.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: "50%", border: "none", flexShrink: 0,
                    background: text.trim()
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "#e5e7eb",
                    cursor: text.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: text.trim() ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                    transition: "all 0.15s",
                  }}>
                  <Send size={17} color={text.trim() ? "#fff" : "#9ca3af"} style={{ transform: "translateX(1px)" }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
