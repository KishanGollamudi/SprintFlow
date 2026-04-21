package com.sprintflow.service;

import com.sprintflow.entity.User;
import com.sprintflow.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Properties;

@Service
public class EmailService {

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.application.name:SprintFlow}")
    private String appName;

    @Value("${app.mail.encryption-key}")
    private String encryptionKey;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ── AES helpers ───────────────────────────────────────────

    private SecretKeySpec aesKey() {
        byte[] raw = encryptionKey.getBytes(StandardCharsets.UTF_8);
        byte[] key = new byte[32];
        System.arraycopy(raw, 0, key, 0, Math.min(raw.length, 32));
        return new SecretKeySpec(key, "AES");
    }

    public String encrypt(String plain) {
        try {
            Cipher c = Cipher.getInstance("AES/ECB/PKCS5Padding");
            c.init(Cipher.ENCRYPT_MODE, aesKey());
            return Base64.getEncoder().encodeToString(
                    c.doFinal(plain.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed: " + e.getMessage(), e);
        }
    }

    public String decrypt(String encrypted) {
        try {
            Cipher c = Cipher.getInstance("AES/ECB/PKCS5Padding");
            c.init(Cipher.DECRYPT_MODE, aesKey());
            return new String(c.doFinal(Base64.getDecoder().decode(encrypted)),
                    StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed: " + e.getMessage(), e);
        }
    }

    // ── Sender builder ────────────────────────────────────────

    private JavaMailSenderImpl buildSender(String smtpEmail, String encryptedPassword) {
        String password = decrypt(encryptedPassword);
        String host     = resolveSmtpHost(smtpEmail);

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(587);
        sender.setUsername(smtpEmail);
        sender.setPassword(password);
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol",     "smtp");
        props.put("mail.smtp.auth",              "true");
        props.put("mail.smtp.starttls.enable",   "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust",         host);
        props.put("mail.smtp.connectiontimeout", "8000");
        props.put("mail.smtp.timeout",           "8000");
        props.put("mail.smtp.writetimeout",      "8000");
        props.put("mail.debug",                  "false");
        return sender;
    }

    private String resolveSmtpHost(String email) {
        String domain = email.toLowerCase().replaceAll(".*@", "");
        if (domain.contains("gmail"))                                    return "smtp.gmail.com";
        if (domain.contains("outlook") || domain.contains("hotmail")
                || domain.contains("office365"))                         return "smtp.office365.com";
        if (domain.contains("yahoo"))                                    return "smtp.mail.yahoo.com";
        return "smtp." + domain;
    }

    private JavaMailSenderImpl resolveManagerSender() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null
                        && "MANAGER".equals(u.getRole().name())
                        && u.getSmtpEmail() != null
                        && u.getSmtpPassword() != null
                        && "Active".equalsIgnoreCase(u.getStatus()))
                .findFirst()
                .map(u -> buildSender(u.getSmtpEmail(), u.getSmtpPassword()))
                .orElseThrow(() -> new RuntimeException(
                        "No mail configuration found. Go to Profile → Mail Settings and save your SMTP credentials first."));
    }

    // ── HTML builders ─────────────────────────────────────────

    private String credentialsHtml(String name, String toEmail, String tempPassword) {
        return "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;"
                + "border:1px solid #e5e7eb;border-radius:12px;overflow:hidden'>"
                + "<div style='background:linear-gradient(135deg,#1a1a2e,#f97316);padding:28px 32px'>"
                + "<h2 style='color:#fff;margin:0;font-size:20px'>" + appName + " — Account Created</h2></div>"
                + "<div style='padding:28px 32px;background:#fff'>"
                + "<p style='color:#374151;font-size:15px'>Dear <strong>" + name + "</strong>,</p>"
                + "<p style='color:#374151;font-size:14px'>Your <strong>" + appName + "</strong> account has been created.</p>"
                + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0'>"
                + "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Login URL</p>"
                + "<p style='margin:0 0 12px;font-size:14px;color:#111827;font-weight:600'>" + frontendUrl + "/login</p>"
                + "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Email</p>"
                + "<p style='margin:0 0 12px;font-size:14px;color:#111827;font-weight:600'>" + toEmail + "</p>"
                + "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Temporary Password</p>"
                + "<p style='margin:0;font-size:16px;color:#f97316;font-weight:700;letter-spacing:2px'>" + tempPassword + "</p>"
                + "</div>"
                + "<p style='color:#ef4444;font-size:13px;font-weight:600'>⚠ Please log in and change your password immediately.</p>"
                + "<p style='color:#9ca3af;font-size:12px;margin-top:24px'>System-generated — do not reply.</p>"
                + "</div></div>";
    }

    private String absenceHtml(String employeeName, String sprintTitle,
                                String date, String timeSlot, String trainerNote) {
        String noteRow = (trainerNote != null && !trainerNote.isBlank())
                ? "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Trainer Note</p>"
                  + "<p style='margin:0 0 12px;font-size:14px;color:#111827'>" + trainerNote + "</p>"
                : "";
        return "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;"
                + "border:1px solid #e5e7eb;border-radius:12px;overflow:hidden'>"
                + "<div style='background:linear-gradient(135deg,#7f1d1d,#ef4444);padding:28px 32px'>"
                + "<h2 style='color:#fff;margin:0;font-size:20px'>" + appName + " — Absence Recorded</h2></div>"
                + "<div style='padding:28px 32px;background:#fff'>"
                + "<p style='color:#374151;font-size:15px'>Dear <strong>" + employeeName + "</strong>,</p>"
                + "<p style='color:#374151;font-size:14px'>You have been marked "
                + "<strong style='color:#ef4444'>ABSENT</strong> for the following session:</p>"
                + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0'>"
                + "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Sprint</p>"
                + "<p style='margin:0 0 12px;font-size:14px;color:#111827;font-weight:600'>" + sprintTitle + "</p>"
                + "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Date</p>"
                + "<p style='margin:0 0 12px;font-size:14px;color:#111827;font-weight:600'>" + date + "</p>"
                + "<p style='margin:4px 0;font-size:13px;color:#6b7280'>Time</p>"
                + "<p style='margin:0 0 12px;font-size:14px;color:#111827;font-weight:600'>" + timeSlot + "</p>"
                + noteRow + "</div>"
                + "<p style='color:#374151;font-size:13px'>If this is an error, contact your trainer.</p>"
                + "<p style='color:#9ca3af;font-size:12px;margin-top:24px'>System-generated — do not reply.</p>"
                + "</div></div>";
    }

    // ── Public API ────────────────────────────────────────────

    /**
     * Synchronous send — used for test emails so SMTP errors propagate
     * back to the controller as an exception (visible in the frontend toast).
     */
    public void sendCredentialsSync(String toEmail, String name, String tempPassword) {
        JavaMailSenderImpl sender = resolveManagerSender(); // throws if not configured
        sendHtml(sender, toEmail,
                "Your " + appName + " Account Credentials",
                credentialsHtml(name, toEmail, tempPassword),
                true); // strict = throw on failure
    }

    /** Async fire-and-forget — used when creating/resending credentials normally. */
    @Async
    public void sendCredentials(String toEmail, String name, String tempPassword) {
        try {
            JavaMailSenderImpl sender = resolveManagerSender();
            sendHtml(sender, toEmail,
                    "Your " + appName + " Account Credentials",
                    credentialsHtml(name, toEmail, tempPassword),
                    false);
        } catch (RuntimeException e) {
            System.out.printf("[EmailService] sendCredentials failed for %s: %s%n", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        try {
            JavaMailSenderImpl sender = resolveManagerSender();
            String resetLink = frontendUrl + "/reset-password?token=" + token;
            String html = "<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;"
                    + "border:1px solid #e5e7eb;border-radius:12px;overflow:hidden'>"
                    + "<div style='background:linear-gradient(135deg,#1a1a2e,#f97316);padding:28px 32px'>"
                    + "<h2 style='color:#fff;margin:0;font-size:20px'>" + appName + " — Password Reset</h2></div>"
                    + "<div style='padding:28px 32px;background:#fff'>"
                    + "<p style='color:#374151;font-size:15px'>Dear <strong>" + name + "</strong>,</p>"
                    + "<p style='color:#374151;font-size:14px'>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>"
                    + "<div style='text-align:center;margin:28px 0'>"
                    + "<a href='" + resetLink + "' style='background:linear-gradient(135deg,#1a1a2e,#f97316);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block'>Reset Password</a>"
                    + "</div>"
                    + "<p style='color:#6b7280;font-size:12px'>Or copy this link: <a href='" + resetLink + "' style='color:#f97316'>" + resetLink + "</a></p>"
                    + "<p style='color:#ef4444;font-size:13px'>If you did not request this, ignore this email — your password will not change.</p>"
                    + "<p style='color:#9ca3af;font-size:12px;margin-top:24px'>System-generated — do not reply.</p>"
                    + "</div></div>";
            sendHtml(sender, toEmail, "[" + appName + "] Reset Your Password", html, false);
        } catch (RuntimeException e) {
            System.out.printf("[EmailService] sendPasswordResetEmail failed for %s: %s%n", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendAbsenceNotification(String toEmail, String employeeName,
                                        String sprintTitle, String date,
                                        String timeSlot, String trainerNote) {
        try {
            JavaMailSenderImpl sender = resolveManagerSender();
            sendHtml(sender, toEmail,
                    "[" + appName + "] Absence Recorded — " + sprintTitle + " on " + date,
                    absenceHtml(employeeName, sprintTitle, date, timeSlot, trainerNote),
                    false);
        } catch (RuntimeException e) {
            System.out.printf("[EmailService] sendAbsenceNotification failed for %s: %s%n", toEmail, e.getMessage());
        }
    }

    // ── Internal send ─────────────────────────────────────────

    /**
     * @param strict if true, throws on failure (for test/sync calls);
     *               if false, logs and swallows (for async background sends).
     */
    private void sendHtml(JavaMailSenderImpl sender, String to,
                          String subject, String html, boolean strict) {
        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(sender.getUsername());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(msg);
            System.out.printf("[EmailService] Sent '%s' to %s%n", subject, to);
        } catch (Exception e) {
            String err = "[EmailService] Failed to send to " + to + ": " + e.getMessage();
            System.err.println(err);
            if (strict) throw new RuntimeException(err, e);
        }
    }
}
