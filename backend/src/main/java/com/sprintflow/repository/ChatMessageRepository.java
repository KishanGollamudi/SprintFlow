package com.sprintflow.repository;

import com.sprintflow.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.senderEmail = :a AND m.recipientEmail = :b)
           OR (m.senderEmail = :b AND m.recipientEmail = :a)
        ORDER BY m.sentAt ASC
        """)
    List<ChatMessage> findConversation(@Param("a") String emailA, @Param("b") String emailB);

    @Query("""
        SELECT DISTINCT
            CASE WHEN m.senderEmail = :email THEN m.recipientEmail
                 ELSE m.senderEmail END
        FROM ChatMessage m
        WHERE m.senderEmail = :email OR m.recipientEmail = :email
        """)
    List<String> findContactEmails(@Param("email") String email);

    /**
     * Returns [senderEmail, count] pairs for all unread messages
     * sent TO the given recipient (readAt IS NULL).
     * Used to restore unread badge counts on page load/refresh.
     */
    @Query("""
        SELECT m.senderEmail, COUNT(m)
        FROM ChatMessage m
        WHERE m.recipientEmail = :recipient AND m.readAt IS NULL
        GROUP BY m.senderEmail
        """)
    List<Object[]> findUnreadCountsByRecipient(@Param("recipient") String recipient);
}
