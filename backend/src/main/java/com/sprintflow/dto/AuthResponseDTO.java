package com.sprintflow.dto;

public class AuthResponseDTO {

    private String accessToken;   // frontend expects "accessToken"
    private String refreshToken;
    private UserInfo user;        // frontend expects nested user object
    private long expiresIn;

    public AuthResponseDTO() {}

    public AuthResponseDTO(String accessToken, String refreshToken, UserInfo user, long expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
        this.expiresIn = expiresIn;
    }

    // Nested user info object matching frontend shape
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
        private String role;     // lowercase: manager, hr, trainer
        private String initials;
        private String status;

        public UserInfo() {}

        public UserInfo(Long id, String name, String email, String role) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role != null ? role.toLowerCase() : null;
            this.initials = name != null && name.length() >= 2
                ? name.substring(0, 1).toUpperCase() + name.split(" ")[name.split(" ").length - 1].substring(0, 1).toUpperCase()
                : "??";
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getInitials() { return initials; }
        public void setInitials(String initials) { this.initials = initials; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // Getters & Setters
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
}
