package com.sprintflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages",
       indexes = {
           @Index(name = "idx_sender",    columnList = "sender_email"),
           @Index(name = "idx_recipient", columnList = "recipient_email"),
           @Index(name = "idx_convo",     columnList = "sender_email, recipient_email")
       })
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_email",    nullable = false, length = 150)
    private String senderEmail;

    @Column(name = "sender_name",     nullable = false, length = 100)
    private String senderName;

    @Column(name = "sender_role",     nullable = false, length = 20)
    private String senderRole;

    @Column(name = "recipient_email", nullable = false, length = 150)
    private String recipientEmail;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    /** Set to true when the message is delivered to the recipient's STOMP queue */
    @Column(name = "delivered", nullable = false)
    private boolean delivered = false;

    /** Timestamp when the recipient opened/read the message; null = unread */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    public ChatMessage() {}

    public ChatMessage(String senderEmail, String senderName, String senderRole,
                       String recipientEmail, String content) {
        this.senderEmail    = senderEmail;
        this.senderName     = senderName;
        this.senderRole     = senderRole;
        this.recipientEmail = recipientEmail;
        this.content        = content;
        this.sentAt         = LocalDateTime.now();
    }

    public Long getId()                          { return id; }
    public String getSenderEmail()               { return senderEmail; }
    public void setSenderEmail(String v)         { this.senderEmail = v; }
    public String getSenderName()                { return senderName; }
    public void setSenderName(String v)          { this.senderName = v; }
    public String getSenderRole()                { return senderRole; }
    public void setSenderRole(String v)          { this.senderRole = v; }
    public String getRecipientEmail()            { return recipientEmail; }
    public void setRecipientEmail(String v)      { this.recipientEmail = v; }
    public String getContent()                   { return content; }
    public void setContent(String v)             { this.content = v; }
    public LocalDateTime getSentAt()             { return sentAt; }
    public void setSentAt(LocalDateTime v)       { this.sentAt = v; }
    public boolean isDelivered()                 { return delivered; }
    public void setDelivered(boolean v)          { this.delivered = v; }
    public LocalDateTime getReadAt()             { return readAt; }
    public void setReadAt(LocalDateTime v)       { this.readAt = v; }
}
