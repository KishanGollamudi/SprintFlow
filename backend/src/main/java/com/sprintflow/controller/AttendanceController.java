package com.sprintflow.controller;

import com.sprintflow.dto.ApiResponseDTO;
import com.sprintflow.dto.AttendanceDTO;
import com.sprintflow.repository.UserRepository;
import com.sprintflow.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@Tag(name = "Attendance", description = "Submit and query attendance records. Trainer submits; all roles read.")
public class AttendanceController {

    @Autowired private AttendanceService attendanceService;
    @Autowired private UserRepository    userRepository;

    @Operation(
        summary     = "Submit attendance",
        description = "**TRAINER only.** Submit attendance for a sprint date. " +
                      "Set `sendAbsenceEmails: true` to email absent employees after submission.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = @ExampleObject(value = """
                    {
                      "sprintId": 1,
                      "attendanceDate": "2026-04-08",
                      "sendAbsenceEmails": false,
                      "records": [
                        { "employeeId": 1, "status": "Present", "checkInTime": "09:05 AM", "notes": null },
                        { "employeeId": 2, "status": "Absent",  "checkInTime": null,       "notes": "No show" }
                      ]
                    }
                    """))
        )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Attendance submitted and locked"),
        @ApiResponse(responseCode = "403", description = "Only TRAINER role can submit")
    })
    @PostMapping("/submit")
    public ResponseEntity<ApiResponseDTO<String>> submit(
            @Valid @RequestBody AttendanceDTO.SubmitRequest request,
            Principal principal) {
        Long userId = resolveUserId(principal);
        attendanceService.submitAttendance(request, userId);
        return ok("Attendance submitted successfully", null);
    }

    @Operation(
        summary     = "Get attendance by sprint + date",
        description = "Returns all attendance records for a specific sprint on a given date. " +
                      "Returns empty array if no attendance has been submitted yet for that date."
    )
    @ApiResponse(responseCode = "200", description = "Records returned (empty array if none submitted yet)")
    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<AttendanceDTO>>> getByDate(
            @Parameter(description = "Sprint ID", example = "1", required = true)
            @RequestParam Long sprintId,
            @Parameter(description = "Date in ISO format YYYY-MM-DD", example = "2026-04-08", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ok("Attendance records retrieved", attendanceService.getByDate(sprintId, date));
    }

    @Operation(
        summary     = "Get all attendance for a sprint",
        description = "Returns every attendance record across all dates for a sprint. Used by Attendance Overview."
    )
    @GetMapping("/all")
    public ResponseEntity<ApiResponseDTO<List<AttendanceDTO>>> getAllBySprint(
            @Parameter(description = "Sprint ID", example = "1", required = true)
            @RequestParam Long sprintId) {
        return ok("All attendance records retrieved", attendanceService.getAllBySprint(sprintId));
    }

    @Operation(
        summary     = "Per-employee attendance stats",
        description = "Returns total/present/late/absent day counts and present% per employee for a sprint."
    )
    @GetMapping("/stats")
    public ResponseEntity<ApiResponseDTO<List<AttendanceDTO.StatsDTO>>> getStats(
            @Parameter(description = "Sprint ID", example = "1", required = true)
            @RequestParam Long sprintId) {
        return ok("Attendance statistics retrieved", attendanceService.getStats(sprintId));
    }

    @Operation(
        summary     = "Cohort-level attendance stats",
        description = "Returns aggregated present/late/absent counts grouped by cohort+technology for a sprint. " +
                      "Used by Trainer Dashboard charts."
    )
    @GetMapping("/cohort-stats")
    public ResponseEntity<ApiResponseDTO<List<AttendanceDTO.CohortStatsDTO>>> getCohortStats(
            @Parameter(description = "Sprint ID", example = "1", required = true)
            @RequestParam Long sprintId) {
        return ok("Cohort statistics retrieved", attendanceService.getCohortStats(sprintId));
    }

    @Operation(summary = "Global cohort-level attendance stats across all sprints")
    @GetMapping("/cohort-stats/all")
    public ResponseEntity<ApiResponseDTO<List<AttendanceDTO.CohortStatsDTO>>> getGlobalCohortStats() {
        return ok("Global cohort statistics retrieved", attendanceService.getGlobalCohortStats());
    }

    @Operation(
        description = "Returns total record count and overall present/late/absent counts across all sprints. " +
                      "Used by Manager Dashboard."
    )
    @GetMapping("/summary")
    public ResponseEntity<ApiResponseDTO<AttendanceDTO.SummaryDTO>> getSummary() {
        return ok("Attendance summary retrieved", attendanceService.getSummary());
    }

    // ── Helpers ───────────────────────────────────────────────

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
