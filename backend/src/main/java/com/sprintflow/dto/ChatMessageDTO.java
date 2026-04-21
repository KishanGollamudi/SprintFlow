package com.sprintflow.dto;

import java.time.LocalDateTime;

public class ChatMessageDTO {

    // ── Inbound: client → /app/chat.send ─────────────────────
    public static class SendRequest {
        private String recipientEmail;
        private String content;

        public String getRecipientEmail() { return recipientEmail; }
        public void setRecipientEmail(String v) { this.recipientEmail = v; }
        public String getContent() { return content; }
        public void setContent(String v) { this.content = v; }
    }

    // ── Outbound: server → /user/{email}/queue/messages ──────
    public static class Payload {
        private Long          id;
        private String        senderEmail;
        private String        senderName;
        private String        senderRole;
        private String        recipientEmail;
        private String        content;
        private java.time.LocalDateTime sentAt;
        private boolean       delivered;
        private java.time.LocalDateTime readAt; // null = unread

        public Payload() {}

        public Payload(Long id, String senderEmail, String senderName, String senderRole,
                       String recipientEmail, String content,
                       java.time.LocalDateTime sentAt, boolean delivered,
                       java.time.LocalDateTime readAt) {
            this.id             = id;
            this.senderEmail    = senderEmail;
            this.senderName     = senderName;
            this.senderRole     = senderRole;
            this.recipientEmail = recipientEmail;
            this.content        = content;
            this.sentAt         = sentAt;
            this.delivered      = delivered;
            this.readAt         = readAt;
        }

        public Long getId()                          { return id; }
        public String getSenderEmail()               { return senderEmail; }
        public String getSenderName()                { return senderName; }
        public String getSenderRole()                { return senderRole; }
        public String getRecipientEmail()            { return recipientEmail; }
        public String getContent()                   { return content; }
        public java.time.LocalDateTime getSentAt()   { return sentAt; }
        public boolean isDelivered()                 { return delivered; }
        public java.time.LocalDateTime getReadAt()   { return readAt; }
    }

    // ── Read receipt: client → /app/chat.read ────────────────────────
    public static class ReadReceipt {
        private Long   messageId;
        private String senderEmail; // notify this person their message was read

        public Long getMessageId()              { return messageId; }
        public void setMessageId(Long v)        { this.messageId = v; }
        public String getSenderEmail()          { return senderEmail; }
        public void setSenderEmail(String v)    { this.senderEmail = v; }
    }

    // ── Contact list item ─────────────────────────────────────
    public static class ContactDTO {
        private String email;
        private String name;
        private String role;
        private String status; // online | away | busy | offline

        public ContactDTO() {}
        public ContactDTO(String email, String name, String role, String status) {
            this.email  = email;
            this.name   = name;
            this.role   = role;
            this.status = status != null ? status : "offline";
        }
        // keep old 3-arg constructor for backward compat
        public ContactDTO(String email, String name, String role) {
            this(email, name, role, "offline");
        }

        public String getEmail()  { return email; }
        public void setEmail(String v)  { this.email = v; }
        public String getName()   { return name; }
        public void setName(String v)   { this.name = v; }
        public String getRole()   { return role; }
        public void setRole(String v)   { this.role = v; }
        public String getStatus() { return status; }
        public void setStatus(String v) { this.status = v; }
    }
}
