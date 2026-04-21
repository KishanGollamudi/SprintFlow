package com.sprintflow.controller;

import com.sprintflow.dto.SprintDTO;
import com.sprintflow.dto.ApiResponseDTO;
import com.sprintflow.dto.EmployeeDTO;
import com.sprintflow.repository.UserRepository;
import com.sprintflow.service.SprintService;
import com.sprintflow.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sprints")
@Tag(name = "Sprints", description = "Sprint lifecycle — HR creates/deletes, HR+Trainer update, all roles read")
public class SprintController {

    @Autowired private SprintService   sprintService;
    @Autowired private EmployeeService employeeService;
    @Autowired private UserRepository  userRepository;

    @Operation(
        summary     = "List all sprints",
        description = "Returns sprints. Supports `status` filter, `q` keyword search, and optional `page`/`pageSize` pagination. " +
                      "When `page` is provided returns `{ items, total, page, pageSize }`. Otherwise returns a plain array."
    )
    @GetMapping
    public ResponseEntity<ApiResponseDTO<Object>> getAllSprints(
            @Parameter(description = "Filter by status", example = "Scheduled")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by technology", example = "Java")
            @RequestParam(required = false) String technology,
            @Parameter(description = "Keyword search on title / trainer name", example = "Java")
            @RequestParam(required = false) String q,
            @Parameter(description = "Page number (1-based)", example = "1")
            @RequestParam(required = false) Integer page,
            @Parameter(description = "Page size", example = "8")
            @RequestParam(required = false) Integer pageSize) {

        List<SprintDTO> sprints = status != null
                ? sprintService.getSprintsByStatus(status)
                : sprintService.getAllSprints();

        // Keyword filter
        if (q != null && !q.isBlank()) {
            String lq = q.trim().toLowerCase();
            sprints = sprints.stream()
                    .filter(s -> (s.getTitle()   != null && s.getTitle().toLowerCase().contains(lq))
                              || (s.getTrainer() != null && s.getTrainer().toLowerCase().contains(lq)))
                    .collect(Collectors.toList());
        }

        // Pagination — only when page param is provided
        if (page != null && page > 0) {
            int size  = (pageSize != null && pageSize > 0) ? pageSize : 10;
            int total = sprints.size();
            int from  = (page - 1) * size;
            int to    = Math.min(from + size, total);
            List<SprintDTO> items = from < total ? sprints.subList(from, to) : List.of();
            Map<String, Object> paged = new HashMap<>();
            paged.put("items",    items);
            paged.put("total",    total);
            paged.put("page",     page);
            paged.put("pageSize", size);
            return ResponseEntity.ok(ApiResponseDTO.<Object>builder()
                    .success(true).message("Sprints retrieved successfully")
                    .data(paged).statusCode(200).build());
        }

        return ResponseEntity.ok(ApiResponseDTO.<Object>builder()
                .success(true).message("Sprints retrieved successfully")
                .data(sprints).statusCode(200).build());
    }

    @Operation(summary = "Get sprint by ID")
    @ApiResponse(responseCode = "404", description = "Sprint not found")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<SprintDTO>> getById(
            @Parameter(description = "Sprint ID", example = "1") @PathVariable Long id) {
        return ok("Sprint retrieved successfully", sprintService.getSprintById(id));
    }

    @Operation(
        summary     = "Get sprints assigned to a trainer",
        description = "Returns all sprints where the given user is the assigned trainer."
    )
    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<ApiResponseDTO<List<SprintDTO>>> getByTrainer(
            @Parameter(description = "Trainer user ID", example = "3") @PathVariable Long trainerId) {
        return ok("Sprints retrieved successfully", sprintService.getSprintsForTrainer(trainerId));
    }

    @Operation(
        summary     = "Create sprint",
        description = "**HR role only.** Creates a new sprint. `createdBy` is resolved from the JWT automatically.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = @ExampleObject(value = """
                    {
                      "title": "Java Sprint - JC1",
                      "technology": "Java",
                      "cohort": "Java cohort 1",
                      "cohorts": [
                        { "technology": "Java", "cohort": "Java cohort 1" },
                        { "technology": "Java", "cohort": "Java cohort 2" }
                      ],
                      "startDate": "2026-04-01",
                      "endDate": "2026-04-30",
                      "sprintStart": "09:00 AM",
                      "sprintEnd": "05:00 PM",
                      "room": "Room 101",
                      "status": "Scheduled"
                    }
                    """))
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Sprint created"),
        @ApiResponse(responseCode = "403", description = "HR role required")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO<SprintDTO>> createSprint(
            @RequestBody SprintDTO dto,
            Principal principal) {
        // Resolve user ID from the JWT principal (email) — no manual Authorization header needed
        Long userId = resolveUserId(principal);
        SprintDTO created = sprintService.createSprint(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponseDTO.<SprintDTO>builder()
                .success(true).message("Sprint created successfully")
                .data(created).statusCode(201).build());
    }

    @Operation(summary = "Update sprint", description = "Full update. HR and Trainer roles.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<SprintDTO>> updateSprint(
            @PathVariable Long id, @RequestBody SprintDTO dto) {
        return ok("Sprint updated successfully", sprintService.updateSprint(id, dto));
    }

    @Operation(
        summary     = "Update sprint status",
        description = "Partial update — status only. Allowed values: `Scheduled`, `On Hold`, `Completed`.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = @ExampleObject(value = "{ \"status\": \"On Hold\" }"))
        )
    )
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponseDTO<SprintDTO>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ok("Status updated successfully", sprintService.updateStatus(id, body.get("status")));
    }

    @Operation(summary = "Delete sprint", description = "**HR role only.**")
    @ApiResponse(responseCode = "403", description = "HR role required")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<String>> deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
        return ok("Sprint deleted successfully", null);
    }

    @Operation(summary = "Get employees enrolled in a sprint")
    @GetMapping("/{id}/employees")
    public ResponseEntity<ApiResponseDTO<List<EmployeeDTO>>> getSprintEmployees(@PathVariable Long id) {
        return ok("Sprint employees retrieved successfully", employeeService.getSprintEmployees(id));
    }

    @Operation(
        summary     = "Enroll employee in sprint",
        description = "Alias path used by the frontend. Delegates to EmployeeService.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = @ExampleObject(value = "{ \"employeeId\": 5 }"))
        )
    )
    @PostMapping("/{id}/employees")
    public ResponseEntity<ApiResponseDTO<String>> enrollEmployee(
            @PathVariable Long id, @RequestBody Map<String, Long> body) {
        employeeService.enrollEmployee(id, body.get("employeeId"));
        return ok("Employee enrolled successfully", null);
    }

    @Operation(summary = "Remove employee from sprint",
        description = "Alias path used by the frontend. Delegates to EmployeeService.")
    @DeleteMapping("/{id}/employees/{empId}")
    public ResponseEntity<ApiResponseDTO<String>> removeEmployee(
            @PathVariable Long id, @PathVariable Long empId) {
        employeeService.removeEmployee(id, empId);
        return ok("Employee removed from sprint", null);
    }

    @Operation(
        summary     = "Check trainer time-slot conflict",
        description = "Returns any existing sprints for the given trainer whose date range AND " +
                      "daily time slot overlap with the proposed sprint. " +
                      "Empty array = no conflict. Used by HR sprint creation form."
    )
    @GetMapping("/check-trainer-conflict")
    public ResponseEntity<ApiResponseDTO<List<SprintDTO>>> checkTrainerConflict(
            @Parameter(description = "Trainer user ID",        example = "3",          required = true)
            @RequestParam Long trainerId,
            @Parameter(description = "Proposed start date",    example = "2026-06-01", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Proposed end date",      example = "2026-06-30", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Daily start time",       example = "09:00 AM",   required = true)
            @RequestParam String sprintStart,
            @Parameter(description = "Daily end time",         example = "05:00 PM",   required = true)
            @RequestParam String sprintEnd,
            @Parameter(description = "Sprint ID to exclude (edit flow)", example = "5")
            @RequestParam(required = false) Long excludeSprintId) {
        List<SprintDTO> conflicts = sprintService.checkTrainerConflict(
                trainerId, startDate, endDate, sprintStart, sprintEnd, excludeSprintId);
        return ok(conflicts.isEmpty() ? "No conflicts" : "Trainer has conflicting sprints", conflicts);
    }

    // ── Helpers ───────────────────────────────────────────────

    /** Resolve DB user ID from the JWT principal (email). */
    private Long resolveUserId(Principal principal) {
        if (principal == null) return null;
        return userRepository.findByEmail(principal.getName())
                .map(u -> u.getId())
                .orElse(null);
    }

    private <T> ResponseEntity<ApiResponseDTO<T>> ok(String message, T data) {
        return ResponseEntity.ok(ApiResponseDTO.<T>builder()
                .success(true).message(message).data(data).statusCode(200).build());
    }
}
