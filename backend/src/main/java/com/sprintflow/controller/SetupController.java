package com.sprintflow.controller;

import com.sprintflow.dto.ApiResponseDTO;
import com.sprintflow.entity.User;
import com.sprintflow.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/setup")
@Tag(name = "Setup", description = "⚠️ DEVELOPMENT ONLY — Remove before production. Resets passwords.")
public class SetupController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Operation(
        summary     = "Reset all user passwords to Admin@123",
        description = "⚠️ **DEVELOPMENT ONLY** — Resets every user's password to `Admin@123`. " +
                      "No authentication required. **Delete this endpoint before deploying to production.**"
    )
    @GetMapping("/reset-passwords")
    public ResponseEntity<ApiResponseDTO<String>> resetPasswords() {
        List<User> users = userRepository.findAll();
        String encoded = passwordEncoder.encode("Admin@123");
        users.forEach(u -> u.setPassword(encoded));
        userRepository.saveAll(users);
        return ResponseEntity.ok(ApiResponseDTO.<String>builder()
                .success(true)
                .message("Reset " + users.size() + " users to password: Admin@123")
                .data(encoded).statusCode(200).build());
    }
}
