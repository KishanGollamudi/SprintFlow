package com.sprintflow.config;

import com.sprintflow.entity.User;
import com.sprintflow.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void resetPasswords() {
        List<User> users = userRepository.findAll();
        if (users.isEmpty()) return;

        // Check if passwords need reset (if stored hash doesn't match Admin@123)
        boolean needsReset = users.stream()
                .anyMatch(u -> !passwordEncoder.matches("Admin@123", u.getPassword()));

        if (needsReset) {
            String encoded = passwordEncoder.encode("Admin@123");
            users.forEach(u -> u.setPassword(encoded));
            userRepository.saveAll(users);
            System.out.println("[DataInitializer] Reset " + users.size() + " user passwords to Admin@123");
        }
    }
}
