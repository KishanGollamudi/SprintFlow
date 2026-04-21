package com.sprintflow.dto;

public class MailConfigDTO {
    private String smtpEmail;
    private String smtpPassword;   // plain-text from frontend; encrypted before storing

    public String getSmtpEmail()    { return smtpEmail; }
    public void setSmtpEmail(String smtpEmail) { this.smtpEmail = smtpEmail; }

    public String getSmtpPassword() { return smtpPassword; }
    public void setSmtpPassword(String smtpPassword) { this.smtpPassword = smtpPassword; }
}
