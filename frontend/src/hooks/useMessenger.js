import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "@/services/api";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api")
  .replace(/\/api$/, "");
// VITE_WS_URL can be set separately if WebSocket goes through ALB directly (not CloudFront)
const WS_URL = import.meta.env.VITE_USE_MOCK === "true"
  ? null
  : import.meta.env.VITE_WS_URL || `${BASE_URL}/ws`;
const UNREAD_KEY = "sprintflow_unread";
const READ_TIMESTAMPS_KEY = "sprintflow_read_timestamps";

export const STATUS_OPTIONS = [
  { value: "online",  label: "Online",  color: "#10b981" },
  { value: "away",    label: "Away",    color: "#f59e0b" },
  { value: "busy",    label: "Busy",    color: "#ef4444" },
  { value: "offline", label: "Offline", color: "#9ca3af" },
];
export const statusColor = (s) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "#9ca3af";

function loadPersistedUnread(userEmail) {
  try {
    const raw = localStorage.getItem(UNREAD_KEY);
    if (!raw) return {};
    return JSON.parse(raw)[userEmail?.toLowerCase()] ?? {};
  } catch { return {}; }
}

function loadReadTimestamps(userEmail) {
  try {
    const raw = localStorage.getItem(READ_TIMESTAMPS_KEY);
    if (!raw) return {};
    return JSON.parse(raw)[userEmail?.toLowerCase()] ?? {};
  } catch { return {}; }
}

function saveReadTimestamp(userEmail, conversationWith) {
  try {
    const raw = localStorage.getItem(READ_TIMESTAMPS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const userKey = userEmail?.toLowerCase();
    if (!all[userKey]) all[userKey] = {};
    all[userKey][conversationWith.toLowerCase()] = Date.now();
    localStorage.setItem(READ_TIMESTAMPS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function savePersistedUnread(userEmail, unread) {
  try {
    const raw = localStorage.getItem(UNREAD_KEY);
    const all = raw ? JSON.parse(raw) : {};
    // Clean up zero counts before saving
    const cleaned = Object.fromEntries(
      Object.entries(unread).filter(([, count]) => count > 0)
    );
    all[userEmail?.toLowerCase()] = cleaned;
    localStorage.setItem(UNREAD_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function unwrap(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    if ("data" in res) return res.data;
    return res;
  }
  return res;
}

export function useMessenger(user) {
  // ── Use refs for values needed inside STOMP callbacks ─────────
  // This prevents stale closure bugs — callbacks always read current values
  const myEmailRef = useRef((user?.email ?? "").toLowerCase());
  const myUserRef  = useRef(user);

  useEffect(() => {
    myEmailRef.current = (user?.email ?? "").toLowerCase();
    myUserRef.current  = user;
  }, [user]);

  const [connected,     setConnected]     = useState(false);
  const [conversations, setConversations] = useState({});
  const [contacts,      setContacts]      = useState([]);
  const [presence,      setPresence]      = useState({});
  const [myStatus,      setMyStatus]      = useState("online");
  const [unread,        setUnread]        = useState(() => loadPersistedUnread(user?.email));

  const clientRef      = useRef(null);
  const activeChatRef  = useRef(null);

  // Persist unread
  useEffect(() => {
    const email = myEmailRef.current;
    if (!email) return;
    savePersistedUnread(email, unread);
  }, [unread]);

  // ── Load contacts + unread + presence ────────────────────────
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    api.get("/messages/contacts")
      .then((res) => {
        const list = (Array.isArray(unwrap(res)) ? unwrap(res) : [])
          .map((c) => ({ ...c, email: (c.email ?? "").toLowerCase() }));
        setContacts(list);
        const p = {};
        list.forEach((c) => { if (c.status) p[c.email] = c.status; });
        setPresence((prev) => ({ ...prev, ...p }));
      }).catch(() => {});

    // Load unread counts from server
    api.get("/messages/unread-counts")
      .then((res) => {
        const map = unwrap(res) ?? {};
        if (typeof map !== "object" || Array.isArray(map)) return;
        const norm = {};
        Object.entries(map).forEach(([k, v]) => { 
          const count = Number(v);
          if (count > 0) {
            norm[k.toLowerCase()] = count;
          }
        });
        
        // Check read timestamps to filter out recently read conversations
        const readTimestamps = loadReadTimestamps(user?.email);
        const now = Date.now();
        const RECENT_READ_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        
        setUnread((prev) => {
          const filtered = {};
          
          Object.entries(norm).forEach(([key, count]) => {
            const readTime = readTimestamps[key];
            // If we marked this conversation as read recently, ignore server count
            if (readTime && (now - readTime) < RECENT_READ_THRESHOLD) {
              // Skip - recently marked as read locally
              return;
            }
            filtered[key] = count;
          });
          
          return filtered;
        });
      }).catch(() => {});

    api.get("/messages/presence")
      .then((res) => {
        const map = unwrap(res) ?? {};
        if (typeof map !== "object" || Array.isArray(map)) return;
        const norm = {};
        Object.entries(map).forEach(([k, v]) => { norm[k.toLowerCase()] = v; });
        setPresence((prev) => ({ ...prev, ...norm }));
      }).catch(() => {});
  }, [user]);

  // ── Load history ──────────────────────────────────────────────
  const loadHistory = useCallback((otherEmail) => {
    if (!otherEmail) return;
    const key = otherEmail.toLowerCase();
    api.get("/messages/history", { params: { with: key } })
      .then((res) => {
        const raw  = unwrap(res);
        const list = (Array.isArray(raw) ? raw : []).map((m) => ({
          ...m,
          senderEmail:    (m.senderEmail    ?? "").toLowerCase(),
          recipientEmail: (m.recipientEmail ?? "").toLowerCase(),
        }));
        setConversations((prev) => ({ ...prev, [key]: list }));
      }).catch(() => {});
  }, []);

  // ── Search users ──────────────────────────────────────────────
  const searchUsers = useCallback((query) => {
    if (!query || query.trim().length < 2) return Promise.resolve([]);
    return api.get("/messages/search", { params: { q: query.trim() } })
      .then((res) => { const raw = unwrap(res); return Array.isArray(raw) ? raw : []; })
      .catch(() => []);
  }, []);

  // ── Send message ──────────────────────────────────────────────
  const send = useCallback(async (recipientEmail, content) => {
    if (!content?.trim() || !recipientEmail) return;
    const key     = recipientEmail.toLowerCase();
    const me      = myEmailRef.current;
    const meUser  = myUserRef.current;

    // Guard: never send to yourself
    if (key === me) return;

    const optimisticId = `opt_${Date.now()}`;
    const optimistic = {
      id:             optimisticId,
      senderEmail:    me,
      senderName:     meUser?.name ?? meUser?.email ?? "",
      senderRole:     (meUser?.role ?? "").toUpperCase(),
      recipientEmail: key,
      content:        content.trim(),
      sentAt:         new Date().toISOString(),
      delivered:      false,
      readAt:         null,
      _optimistic:    true,
    };

    // Add optimistic message to the RECIPIENT's conversation key
    setConversations((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), optimistic],
    }));

    const client = clientRef.current;

    if (client?.connected) {
      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ recipientEmail: key, content: content.trim() }),
      });
    } else {
      try {
        const res   = await api.post("/messages/send", { recipientEmail: key, content: content.trim() });
        const saved = unwrap(res);
        if (saved?.id) {
          const real = {
            ...saved,
            senderEmail:    (saved.senderEmail    ?? "").toLowerCase(),
            recipientEmail: (saved.recipientEmail ?? "").toLowerCase(),
          };
          setConversations((prev) => {
            const clean = (prev[key] ?? []).filter((m) => m.id !== optimisticId);
            return { ...prev, [key]: [...clean, real] };
          });
        }
      } catch {
        setConversations((prev) => ({
          ...prev,
          [key]: (prev[key] ?? []).filter((m) => m.id !== optimisticId),
        }));
      }
    }
  }, []);

  // ── Mark as read ──────────────────────────────────────────────
  const markRead = useCallback(async (otherEmail) => {
    const key = (otherEmail ?? "").toLowerCase();
    activeChatRef.current = key;
    
    // Save timestamp of when we marked this conversation as read
    saveReadTimestamp(myEmailRef.current, key);
    
    // Update local state immediately
    setUnread((prev) => {
      const updated = prev[key] ? { ...prev, [key]: 0 } : prev;
      // Remove zero counts to clean up localStorage
      const cleaned = Object.fromEntries(
        Object.entries(updated).filter(([, count]) => count > 0)
      );
      return cleaned;
    });
    
    // Send read receipt via WebSocket if connected
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({
        destination: "/app/chat.read",
        body: JSON.stringify({ conversationWith: key }),
      });
    }
    
    // Also send HTTP request to ensure server knows messages are read
    try {
      await api.post("/messages/mark-read", { conversationWith: key });
    } catch (error) {
      console.warn("Failed to mark messages as read on server:", error);
      // Don't throw - local state is already updated
    }
  }, []);

  const updateMyStatus = useCallback((status) => {
    setMyStatus(status);
    const client = clientRef.current;
    if (client?.connected) {
      client.publish({ destination: "/app/chat.status", body: JSON.stringify({ status }) });
    }
  }, []);

  // ── STOMP connection ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !WS_URL) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const client = new Client({
      webSocketFactory:  () => new SockJS(WS_URL, null, { transports: ["websocket", "xhr-streaming", "xhr-polling"] }),
      connectHeaders:    { Authorization: `Bearer ${token}` },
      reconnectDelay:    3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setConnected(true);
        client.publish({ destination: "/app/chat.connect", body: "{}" });

        client.subscribe("/user/queue/messages", (frame) => {
          try {
            const data = JSON.parse(frame.body);
            const me   = myEmailRef.current; // always current — no stale closure

            // Read receipt
            if (data.type === "READ_RECEIPT") {
              const other = (data.conversationWith ?? "").toLowerCase();
              setConversations((prev) => {
                const msgs = prev[other];
                if (!msgs) return prev;
                return {
                  ...prev,
                  [other]: msgs.map((m) =>
                    m.senderEmail === me ? { ...m, readAt: data.readAt } : m
                  ),
                };
              });
              return;
            }

            const msg = {
              ...data,
              senderEmail:    (data.senderEmail    ?? "").toLowerCase(),
              recipientEmail: (data.recipientEmail ?? "").toLowerCase(),
            };

            // Determine the conversation key — always the OTHER person's email
            const other = msg.senderEmail === me ? msg.recipientEmail : msg.senderEmail;

            // Guard: ignore if somehow routed to self
            if (!other || other === me) return;

            setConversations((prev) => {
              const existing = prev[other] ?? [];
              if (msg.id == null) return prev;
              if (existing.some((m) => m.id === msg.id)) return prev;
              // Replace matching optimistic entry
              const clean = existing.filter(
                (m) => !(m._optimistic && m.senderEmail === msg.senderEmail && m.content === msg.content)
              );
              return { ...prev, [other]: [...clean, msg] };
            });

            // Unread badge only for messages FROM others
            if (msg.senderEmail !== me && activeChatRef.current !== other) {
              setUnread((prev) => ({ ...prev, [other]: (prev[other] ?? 0) + 1 }));
            }

            // Auto-add to contacts
            setContacts((prev) => {
              if (prev.some((c) => (c.email ?? "").toLowerCase() === other)) return prev;
              return [...prev, {
                email:  other,
                name:   msg.senderName ?? other,
                role:   msg.senderRole ?? "",
                status: "online",
              }];
            });
          } catch {
            /* ignore */
          }
        });

        client.subscribe("/topic/presence", (frame) => {
          try {
            const { email, status } = JSON.parse(frame.body);
            setPresence((prev) => ({ ...prev, [(email ?? "").toLowerCase()]: status }));
          } catch {
            /* ignore */
          }
        });
      },

      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [user]);

  // ── Polling fallback — reload history every 3s only when WebSocket is disconnected ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChatRef.current && !clientRef.current?.connected) {
        loadHistory(activeChatRef.current);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [loadHistory]);

  const totalUnread = Object.values(unread).reduce((s, n) => s + n, 0);

  return {
    connected, conversations, contacts, presence,
    myStatus, updateMyStatus,
    unread, totalUnread,
    send, loadHistory, searchUsers, markRead,
  };
}
