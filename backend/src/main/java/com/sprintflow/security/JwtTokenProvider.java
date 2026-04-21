package com.sprintflow.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {
    
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    
    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration:604800000}")
    private long jwtRefreshExpirationMs;
    
    private SecretKey getSigningKey() {
        // Ensure secret is long enough for HS512
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
    
    public String generateToken(Long userId, String email, String role) {
        return buildToken(userId, email, role, jwtExpirationMs);
    }

    public String generateRefreshToken(Long userId, String email, String role) {
        return buildToken(userId, email, role, jwtRefreshExpirationMs);
    }

    private String buildToken(Long userId, String email, String role, long expiryMs) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(getSigningKey())
                .compact();
    }
    
    private Claims getClaims(String token) {
        return Jwts.parser() 
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token) // Replaces parseClaimsJws
                .getPayload(); // Replaces getBody()
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return Long.parseLong(claims.getSubject());
    }
    
    public String getEmailFromToken(String token) {
        return getClaims(token).get("email", String.class);
    }
    
    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }
    
    public boolean validateToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return false;
            }
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }
    
    public long getExpirationTime() {
        return jwtExpirationMs;
    }
}