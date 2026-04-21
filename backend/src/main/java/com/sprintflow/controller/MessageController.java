package com.sprintflow.controller;

import com.sprintflow.dto.ChatMessageDTO;
import com.sprintflow.entity.ChatMessage;
import com.sprintflow.entity.User;
import com.sprintflow.repository.ChatMessageRepository;
import com.sprintflow.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@Tag(name = "Messages", description = "Private real-time messaging. WebSocket: ws://localhost:8080/ws")
public class MessageController {

    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private UserRepository        userRepository;

    private final Map<String, String> presenceMap = new ConcurrentHashMap<>();

    // ── STOMP: send private message ───────────────────────────
    @MessageMapping("/chat.send")
    public void send(@Payload ChatMessageDTO.SendRequest req,
                     SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        if (req.getRecipientEmail() == null || req.getContent() == null
                || req.getContent().isBlank()) return;

        String senderEmail    = principal.getName().toLowerCase();
        String recipientEmail = req.getRecipientEmail().trim().toLowerCase();
        if (senderEmail.equals(recipientEmail)) return;

        User sender = userRepository.findByEmail(senderEmail).orElse(null);
        if (sender == null) return;

        // Persist — mark delivered immediately (message reached the server)
        ChatMessage saved = new ChatMessage(
                senderEmail, sender.getName(),
                sender.getRole() != null ? sender.getRole().name() : "UNKNOWN",
                recipientEmail, req.getContent().trim());
        saved.setDelivered(true);
        chatMessageRepository.save(saved);

        ChatMessageDTO.Payload payload = toPayload(saved);

        // Deliver to recipient's private queue
        messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/messages", payload);
        // Echo to sender so their UI updates
        messagingTemplate.convertAndSendToUser(senderEmail, "/queue/messages", payload);
    }

    // ── STOMP: mark messages as read (seen receipt) ───────────
    // Client publishes when the recipient opens the conversation.
    // Payload: { senderEmail: "...", conversationWith: "..." }
    @MessageMapping("/chat.read")
    public void markRead(@Payload Map<String, String> body,
                         SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;

        String readerEmail = principal.getName().toLowerCase();
        String otherEmail  = body.getOrDefault("conversationWith", "").toLowerCase();
        if (otherEmail.isBlank()) return;

        // Mark all unread messages from otherEmail → readerEmail as read
        List<ChatMessage> unread = chatMessageRepository
                .findConversation(readerEmail, otherEmail)
                .stream()
                .filter(m -> m.getRecipientEmail().equals(readerEmail) && m.getReadAt() == null)
                .collect(Collectors.toList());

        if (unread.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        unread.forEach(m -> m.setReadAt(now));
        chatMessageRepository.saveAll(unread);

        // Notify the original sender that their messages were read
        Map<String, Object> receipt = Map.of(
                "type",             "READ_RECEIPT",
                "conversationWith", readerEmail,
                "readAt",           now.toString()
        );
        messagingTemplate.convertAndSendToUser(otherEmail, "/queue/messages", receipt);
    }

    // ── STOMP: presence status ────────────────────────────────
    @MessageMapping("/chat.status")
    public void updateStatus(@Payload Map<String, String> body,
                             SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        String email  = principal.getName().toLowerCase();
        String status = body.getOrDefault("status", "online");
        presenceMap.put(email, status);
        messagingTemplate.convertAndSend("/topic/presence", Map.of("email", email, "status", status));
    }

    @MessageMapping("/chat.connect")
    public void onConnect(SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        String email = principal.getName().toLowerCase();
        presenceMap.put(email, "online");
        messagingTemplate.convertAndSend("/topic/presence", Map.of("email", email, "status", "online"));
    }

    // ── REST endpoints ────────────────────────────────────────

    @Operation(summary = "Get conversation history")
    @GetMapping("/history")
    public List<ChatMessageDTO.Payload> history(
            @Parameter(description = "Email of the other participant", required = true)
            @RequestParam("with") String otherEmail,
            Principal principal) {
        if (principal == null) return List.of();
        String me = principal.getName().toLowerCase();
        return chatMessageRepository
                .findConversation(me, otherEmail.trim().toLowerCase())
                .stream().map(this::toPayload).collect(Collectors.toList());
    }

    @Operation(
        summary     = "Send message via REST (fallback when WebSocket is unavailable)",
        description = "Persists the message to DB and delivers via STOMP if recipient is connected. " +
                      "Use this when the WebSocket connection is not yet established."
    )
    @PostMapping("/send")
    public ChatMessageDTO.Payload sendRest(
            @RequestBody ChatMessageDTO.SendRequest req,
            Principal principal) {
        if (principal == null) return null;
        String senderEmail    = principal.getName().toLowerCase();
        String recipientEmail = req.getRecipientEmail().trim().toLowerCase();
        if (senderEmail.equals(recipientEmail)) return null;

        User sender = userRepository.findByEmail(senderEmail).orElse(null);
        if (sender == null) return null;

        ChatMessage saved = new ChatMessage(
                senderEmail, sender.getName(),
                sender.getRole() != null ? sender.getRole().name() : "UNKNOWN",
                recipientEmail, req.getContent().trim());
        saved.setDelivered(true);
        chatMessageRepository.save(saved);

        ChatMessageDTO.Payload payload = toPayload(saved);

        // Attempt real-time delivery via STOMP (no-op if recipient not connected)
        try {
            messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/messages", payload);
            messagingTemplate.convertAndSendToUser(senderEmail,    "/queue/messages", payload);
        } catch (Exception ignored) { /* STOMP delivery is best-effort */ }

        return payload;
    }

    @Operation(summary = "Get chat contacts")
    @GetMapping("/contacts")
    public List<ChatMessageDTO.ContactDTO> contacts(Principal principal) {
        if (principal == null) return List.of();
        String me = principal.getName().toLowerCase();
        return chatMessageRepository.findContactEmails(me).stream()
                .map(email -> userRepository.findByEmail(email)
                        .map(u -> new ChatMessageDTO.ContactDTO(
                                u.getEmail(), u.getName(),
                                u.getRole() != null ? u.getRole().name() : "",
                                presenceMap.getOrDefault(u.getEmail().toLowerCase(), "offline")))
                        .orElse(new ChatMessageDTO.ContactDTO(email, email, "", "offline")))
                .collect(Collectors.toList());
    }

    @Operation(summary = "Search users for new conversations")
    @GetMapping("/search")
    public List<ChatMessageDTO.ContactDTO> searchUsers(
            @Parameter(description = "Search query (min 2 chars)", required = true)
            @RequestParam("q") String query,
            Principal principal) {
        if (principal == null || query == null || query.trim().length() < 2) return List.of();
        String me = principal.getName().toLowerCase();
        String q  = query.trim().toLowerCase();
        return userRepository.findAllActive().stream()
                .filter(u -> !u.getEmail().equalsIgnoreCase(me))
                .filter(u -> u.getName().toLowerCase().contains(q) || u.getEmail().toLowerCase().contains(q))
                .map(u -> new ChatMessageDTO.ContactDTO(
                        u.getEmail(), u.getName(),
                        u.getRole() != null ? u.getRole().name() : "",
                        presenceMap.getOrDefault(u.getEmail().toLowerCase(), "offline")))
                .collect(Collectors.toList());
    }

    @Operation(summary = "Get current presence map")
    @GetMapping("/presence")
    public Map<String, String> presence() {
        return presenceMap;
    }

    @Operation(
        summary     = "Get unread message counts per sender",
        description = "Returns a map of { senderEmail: unreadCount } for all unread messages " +
                      "sent to the authenticated user. Used to restore badge counts on page load."
    )
    @GetMapping("/unread-counts")
    public Map<String, Long> unreadCounts(Principal principal) {
        if (principal == null) return Map.of();
        String me = principal.getName().toLowerCase();
        Map<String, Long> result = new java.util.HashMap<>();
        chatMessageRepository.findUnreadCountsByRecipient(me)
                .forEach(row -> result.put((String) row[0], (Long) row[1]));
        return result;
    }

    private ChatMessageDTO.Payload toPayload(ChatMessage m) {
        return new ChatMessageDTO.Payload(
                m.getId(), m.getSenderEmail(), m.getSenderName(),
                m.getSenderRole(), m.getRecipientEmail(),
                m.getContent(), m.getSentAt(),
                m.isDelivered(), m.getReadAt());
    }
}
