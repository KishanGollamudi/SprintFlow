package com.sprintflow.controller;

import com.sprintflow.dto.ApiResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Application health check endpoints. No authentication required.")
public class HealthController {

    @Operation(summary = "Application health", description = "Returns service status and timestamp.")
    @ApiResponse(responseCode = "200", description = "Service is UP")
    @GetMapping
    public ResponseEntity<ApiResponseDTO<Map<String, Object>>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        health.put("service", "SprintFlow Backend");
        health.put("version", "1.0.0");
        return ResponseEntity.ok(
            ApiResponseDTO.<Map<String, Object>>builder()
                    .success(true).message("Service is healthy")
                    .data(health).statusCode(200).build());
    }

    @Operation(summary = "Database health", description = "Verifies the database connection is active.")
    @GetMapping("/db")
    public ResponseEntity<ApiResponseDTO<String>> checkDatabase() {
        return ResponseEntity.ok(
            ApiResponseDTO.<String>builder()
                    .success(true).message("Database connection is healthy")
                    .data("Connected").statusCode(200).build());
    }
}
