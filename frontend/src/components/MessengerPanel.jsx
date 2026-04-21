import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Wifi, WifiOff, Search, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMessengerContext } from "@/context/MessengerContext";
import { statusColor } from "@/hooks/useMessenger";

const ROLE_COLOR = {
  MANAGER: "#374151",
  HR:      "#D45769",
  TRAINER: "#0d9488",
};

const ROLE_LABEL = {
  MANAGER: "Manager",
  HR:      "HR",
  TRAINER: "Trainer",
};

// Format time — "10:32 AM" for today, "Mon 10:32" for this week, "12 Apr" for older
function formatTime(sentAt) {
  if (!sentAt) return "";
  const d    = new Date(sentAt);
  const now  = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const thisWeek = diff < 7 * 86400000;
  if (thisWeek)   return d.toLocaleDateString([], { weekday: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

// Avatar circle
function Avatar({ name, email, role, size = 36 }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (email ?? "?").slice(0, 2).toUpperCase();
  const bg = ROLE_COLOR[role?.toUpperCase()] ?? "#6b7280";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.33, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

export default function MessengerPanel() {
  const { user } = useAuth();
  const {
    connected, conversations, contacts,
    presence, unread, totalUnread,
    send, loadHistory, searchUsers, markRead,
  } = useMessengerContext();

  const [open,        setOpen]        = useState(false);
  const [activeEmail, setActiveEmail] = useState(null);
  const [text,        setText]        = useState("");
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState([]);
  const bottomRef = useRef(null);

  const myEmail   = (user?.email ?? "").toLowerCase();
  const roleColor = ROLE_COLOR[user?.role?.toUpperCase()] ?? "#0d9488";
  const messages  = activeEmail ? (conversations[activeEmail] ?? []) : [];

  const activeContact = [...contacts, ...results].find((c) => (c.email ?? "").toLowerCase() === activeEmail);

  useEffect(() => {
    if (activeEmail) { loadHistory(activeEmail); markRead(activeEmail); }
  }, [activeEmail, loadHistory, markRead]);

  useEffect(() => {
    if (open && activeEmail) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, activeEmail]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    searchUsers(query).then(setResults);
  }, [query, searchUsers]);

  if (!user) return null;

  const handleSend = () => {
    if (!text.trim() || !activeEmail) return;
    send(activeEmail, text.trim());
    setText("");
  };

  const openChat = (email) => {
    setActiveEmail(email.toLowerCase());
    setQuery(""); setResults([]);
  };

  const allContacts = [
    ...contacts,
    ...results.filter((r) => !contacts.some((c) => (c.email ?? "").toLowerCase() === (r.email ?? "").toLowerCase())),
  ];

  // Group messages by date for date separators
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = msg.sentAt ? new Date(msg.sentAt).toDateString() : "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: roleColor, border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? <X size={20} color="#fff" /> : <MessageSquare size={20} color="#fff" />}
        {!open && totalUnread > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: "#ef4444", border: "2px solid #fff",
            color: "#fff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
          }}>
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 20,  scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", bottom: 88, right: 24, zIndex: 1000,
              width: 380, height: 560,
              background: "#fff", borderRadius: 16,
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              display: "flex", flexDirection: "column",
              overflow: "hidden", border: "1px solid #e5e7eb",
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: "0 16px", height: 56, background: roleColor, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {activeEmail && (
                  <button onClick={() => setActiveEmail(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                    <ChevronLeft size={18} color="#fff" />
                  </button>
                )}
                {activeEmail && activeContact ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ position: "relative" }}>
                      <Avatar name={activeContact.name} email={activeContact.email} role={activeContact.role} size={32} />
                      <span style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 9, height: 9, borderRadius: "50%",
                        background: statusColor(presence[activeContact.email] ?? "offline"),
                        border: "1.5px solid " + roleColor,
                      }} />
                    </div>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.2 }}>
                        {activeContact.name ?? activeEmail}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0 }}>
                        {ROLE_LABEL[activeContact.role?.toUpperCase()] ?? activeContact.role}
                        {" · "}
                        <span style={{ color: statusColor(presence[activeContact.email] ?? "offline") }}>
                          {presence[activeContact.email] ?? "offline"}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MessageSquare size={16} color="#fff" />
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Chat</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {connected
                  ? <Wifi size={14} color="rgba(255,255,255,0.8)" title="Connected" />
                  : <WifiOff size={14} color="rgba(255,255,255,0.5)" title="Disconnected" />}
                <button onClick={() => setOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={16} color="rgba(255,255,255,0.8)" />
                </button>
              </div>
            </div>

            {/* ── Contact list ── */}
            {!activeEmail && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Search */}
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      value={query} onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search people…"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "7px 10px 7px 28px", borderRadius: 8,
                        border: "1px solid #e5e7eb", fontSize: 13,
                        outline: "none", background: "#f9fafb", color: "#111827",
                      }}
                    />
                  </div>
                </div>

                {/* Contacts */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {allContacts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <MessageSquare size={32} style={{ color: "#d1d5db", margin: "0 auto 8px" }} />
                      <p style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600 }}>
                        {query.length >= 2 ? "No people found" : "Search to start a chat"}
                      </p>
                    </div>
                  )}
                  {allContacts.map((c) => {
                    const unreadCount = unread[c.email] ?? 0;
                    const lastMsg     = (conversations[c.email] ?? []).slice(-1)[0];
                    return (
                      <div key={c.email} onClick={() => openChat(c.email)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", cursor: "pointer",
                          borderBottom: "1px solid #f9fafb",
                          background: unreadCount > 0 ? "#f0f9ff" : "#fff",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = unreadCount > 0 ? "#f0f9ff" : "#fff"}
                      >
                        {/* Avatar with presence */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <Avatar name={c.name} email={c.email} role={c.role} size={40} />
                          <span style={{
                            position: "absolute", bottom: 1, right: 1,
                            width: 10, height: 10, borderRadius: "50%",
                            background: statusColor(presence[c.email] ?? "offline"),
                            border: "2px solid #fff",
                          }} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontWeight: unreadCount > 0 ? 700 : 600, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.name ?? c.email}
                            </span>
                            <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>
                              {lastMsg ? formatTime(lastMsg.sentAt) : ""}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                            <p style={{ fontSize: 11, color: unreadCount > 0 ? "#374151" : "#9ca3af", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unreadCount > 0 ? 600 : 400 }}>
                              {lastMsg
                                ? ((lastMsg.senderEmail ?? "").toLowerCase() === myEmail ? "You: " : "") + lastMsg.content
                                : ROLE_LABEL[c.role?.toUpperCase()] ?? c.role ?? ""}
                            </p>
                            {unreadCount > 0 && (
                              <span style={{
                                minWidth: 18, height: 18, borderRadius: 9, flexShrink: 0,
                                background: roleColor, color: "#fff",
                                fontSize: 10, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                              }}>{unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Chat view ── */}
            {activeEmail && (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2, background: "#fafafa" }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <Avatar name={activeContact?.name} email={activeEmail} role={activeContact?.role} size={48} />
                      <p style={{ color: "#374151", fontSize: 14, fontWeight: 700, marginTop: 10 }}>
                        {activeContact?.name ?? activeEmail}
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                        {ROLE_LABEL[activeContact?.role?.toUpperCase()] ?? activeContact?.role ?? ""}
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
                        No messages yet. Say hello! 👋
                      </p>
                    </div>
                  )}

                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      {/* Date separator */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px" }}>
                        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {new Date(date).toDateString() === new Date().toDateString()
                            ? "Today"
                            : new Date(date).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                      </div>

                      {/* Messages */}
                      {msgs.map((msg, i) => {
                        const isOwn    = (msg.senderEmail ?? "").toLowerCase() === myEmail;
                        const prevMsg  = msgs[i - 1];
                        const showMeta = !prevMsg || (prevMsg.senderEmail ?? "").toLowerCase() !== (msg.senderEmail ?? "").toLowerCase();

                        return (
                          <div key={msg.id ?? i} style={{
                            display: "flex", flexDirection: isOwn ? "row-reverse" : "row",
                            alignItems: "flex-end", gap: 8,
                            marginTop: showMeta ? 10 : 2,
                          }}>
                            {/* Avatar — only show on first message in a group */}
                            <div style={{ width: 28, flexShrink: 0 }}>
                              {!isOwn && showMeta && (
                                <Avatar name={msg.senderName} email={msg.senderEmail} role={msg.senderRole} size={28} />
                              )}
                            </div>

                            <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                              {/* Sender name + time — only on first in group */}
                              {showMeta && (
                                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3, flexDirection: isOwn ? "row-reverse" : "row" }}>
                                  {!isOwn && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: ROLE_COLOR[msg.senderRole?.toUpperCase()] ?? "#374151" }}>
                                      {msg.senderName ?? msg.senderEmail}
                                    </span>
                                  )}
                                  <span style={{ fontSize: 10, color: "#9ca3af" }}>
                                    {formatTime(msg.sentAt)}
                                  </span>
                                </div>
                              )}

                              {/* Bubble */}
                              <div style={{
                                padding: "8px 12px",
                                borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: isOwn ? roleColor : "#fff",
                                color: isOwn ? "#fff" : "#111827",
                                fontSize: 13, lineHeight: 1.5,
                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                border: isOwn ? "none" : "1px solid #e5e7eb",
                                wordBreak: "break-word",
                              }}>
                                {msg.content}
                              </div>

                              {/* Read receipt */}
                              {isOwn && msg.readAt && (
                                <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>✓✓ Seen</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* ── Input ── */}
                <div style={{ padding: "10px 12px", borderTop: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb", padding: "6px 8px 6px 12px" }}>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={connected ? "Type a message…" : "Connecting…"}
                      disabled={!connected}
                      rows={1}
                      style={{
                        flex: 1, resize: "none", fontSize: 13, border: "none",
                        outline: "none", background: "transparent",
                        fontFamily: "inherit", color: "#111827",
                        maxHeight: 80, overflowY: "auto",
                        lineHeight: 1.5, padding: "4px 0",
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!connected || !text.trim()}
                      style={{
                        width: 34, height: 34, borderRadius: 8, border: "none", flexShrink: 0,
                        background: connected && text.trim() ? roleColor : "#e5e7eb",
                        cursor: connected && text.trim() ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                      }}
                    >
                      <Send size={14} color={connected && text.trim() ? "#fff" : "#9ca3af"} />
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 4px 0", textAlign: "right" }}>
                    Enter to send · Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
