package com.sprintflow.service;

import com.sprintflow.dto.AttendanceDTO;
import com.sprintflow.entity.Attendance;
import com.sprintflow.entity.Employee;
import com.sprintflow.entity.Sprint;
import com.sprintflow.entity.User;
import com.sprintflow.exception.ResourceNotFoundException;
import com.sprintflow.repository.AttendanceRepository;
import com.sprintflow.repository.EmployeeRepository;
import com.sprintflow.repository.SprintRepository;
import com.sprintflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private SprintRepository     sprintRepository;
    @Autowired private EmployeeRepository   employeeRepository;
    @Autowired private UserRepository       userRepository;
    @Autowired private EmailService         emailService;

    // ── Submit attendance for a date ─────────────────────────
    @Transactional
    public void submitAttendance(AttendanceDTO.SubmitRequest request, Long markedByUserId) {
        if (markedByUserId == null)
            throw new com.sprintflow.exception.AuthenticationException("Authenticated user required to submit attendance");

        Sprint sprint = sprintRepository.findById(request.getSprintId())
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + request.getSprintId()));
        User markedBy = userRepository.findById(markedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + markedByUserId));

        // Build time slot string from sprint fields
        String timeSlot = buildTimeSlot(sprint);

        for (AttendanceDTO.SubmitRequest.AttendanceRecord rec : request.getRecords()) {
            Employee emp = employeeRepository.findById(rec.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + rec.getEmployeeId()));

            Attendance att = attendanceRepository
                    .findBySprintIdAndEmployeeIdAndAttendanceDate(
                            sprint.getId(), emp.getId(), request.getAttendanceDate())
                    .orElse(new Attendance());

            att.setSprint(sprint);
            att.setEmployee(emp);
            att.setAttendanceDate(request.getAttendanceDate());
            att.setStatus(rec.getStatus());
            att.setCheckInTime(rec.getCheckInTime());
            att.setNotes(rec.getNotes());
            att.setSubmitted(true);
            att.setMarkedBy(markedBy);
            if (att.getId() == null) att.setCreatedAt(LocalDateTime.now());
            att.setUpdatedAt(LocalDateTime.now());
            // createdAt is only set on new records (id == null); never overwritten on update

            attendanceRepository.save(att);

            // Send absence email if trainer enabled the toggle and employee has an email
            if (request.isSendAbsenceEmails()
                    && "Absent".equalsIgnoreCase(rec.getStatus())
                    && emp.getEmail() != null
                    && !emp.getEmail().isBlank()) {
                sendAbsenceEmailAsync(
                        emp.getEmail(),
                        emp.getName(),
                        sprint.getTitle(),
                        request.getAttendanceDate().toString(),
                        timeSlot,
                        rec.getNotes()
                );
            }
        }
    }

    // Fire-and-forget so the HTTP response is not delayed by email sending
    @Async
    public void sendAbsenceEmailAsync(String email, String name, String sprintTitle,
                                      String date, String timeSlot, String note) {
        try {
            emailService.sendAbsenceNotification(email, name, sprintTitle, date, timeSlot, note);
        } catch (Exception ex) {
            System.err.printf("[AttendanceService] Failed to send absence email to %s: %s%n",
                    email, ex.getMessage());
        }
    }

    // ── Get attendance by sprint + date ──────────────────────
    public List<AttendanceDTO> getByDate(Long sprintId, LocalDate date) {
        return attendanceRepository.findBySprintIdAndAttendanceDate(sprintId, date)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Get ALL attendance records for a sprint (all dates) ──
    public List<AttendanceDTO> getAllBySprint(Long sprintId) {
        return attendanceRepository.findBySprintId(sprintId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Per-employee stats for a sprint ──────────────────────
    public List<AttendanceDTO.StatsDTO> getStats(Long sprintId) {
        List<Object[]> raw = attendanceRepository.getStatsBySprintId(sprintId);
        List<AttendanceDTO.StatsDTO> stats = new ArrayList<>();
        for (Object[] row : raw) {
            Long empId = (Long) row[0];
            Employee emp = employeeRepository.findById(empId).orElse(null);
            if (emp == null) continue;

            AttendanceDTO.StatsDTO stat = new AttendanceDTO.StatsDTO();
            stat.setEmployeeId(empId);
            stat.setEmpId(emp.getEmpId());
            stat.setEmployeeName(emp.getName());
            stat.setCohort(emp.getCohort());
            stat.setTechnology(emp.getTechnology());
            stat.setTotalDays((Long) row[1]);
            stat.setPresentDays((Long) row[2]);
            stat.setLateDays((Long) row[3]);
            stat.setAbsentDays((Long) row[4]);
            stat.setPresentPercentage(stat.getTotalDays() > 0
                    ? Math.round((stat.getPresentDays() * 100.0 / stat.getTotalDays()) * 100) / 100.0
                    : 0);
            stats.add(stat);
        }
        return stats;
    }

    // ── Cohort-level stats for a sprint ──────────────────────
    public List<AttendanceDTO.CohortStatsDTO> getCohortStats(Long sprintId) {
        List<Object[]> raw = attendanceRepository.getCohortStatsBySprintId(sprintId);
        List<AttendanceDTO.CohortStatsDTO> stats = new ArrayList<>();
        for (Object[] row : raw) {
            AttendanceDTO.CohortStatsDTO stat = new AttendanceDTO.CohortStatsDTO();
            stat.setCohort((String) row[0]);
            stat.setTechnology((String) row[1]);
            stat.setTotalDays((Long) row[2]);
            stat.setPresentDays((Long) row[3]);
            stat.setLateDays((Long) row[4]);
            stat.setAbsentDays((Long) row[5]);
            stat.setPresentPercentage(stat.getTotalDays() > 0
                    ? Math.round((stat.getPresentDays() * 100.0 / stat.getTotalDays()) * 100) / 100.0
                    : 0);
            stats.add(stat);
        }
        return stats;
    }

    // ── Global cohort stats across all sprints ────────────────
    public List<AttendanceDTO.CohortStatsDTO> getGlobalCohortStats() {
        List<Object[]> raw = attendanceRepository.getGlobalCohortStats();
        List<AttendanceDTO.CohortStatsDTO> stats = new ArrayList<>();
        for (Object[] row : raw) {
            AttendanceDTO.CohortStatsDTO stat = new AttendanceDTO.CohortStatsDTO();
            stat.setCohort((String) row[0]);
            stat.setTechnology((String) row[1]);
            stat.setTotalDays((Long) row[2]);
            stat.setPresentDays((Long) row[3]);
            stat.setLateDays((Long) row[4]);
            stat.setAbsentDays((Long) row[5]);
            stat.setPresentPercentage(stat.getTotalDays() > 0
                    ? Math.round((stat.getPresentDays() * 100.0 / stat.getTotalDays()) * 100) / 100.0
                    : 0);
            stats.add(stat);
        }
        return stats;
    }

    // ── Overall summary across all sprints (ManagerDashboard) ─
    public AttendanceDTO.SummaryDTO getSummary() {
        long total   = attendanceRepository.count();
        long present = attendanceRepository.countByStatus("Present");
        long late    = attendanceRepository.countByStatus("Late");
        long absent  = attendanceRepository.countByStatus("Absent");

        AttendanceDTO.SummaryDTO summary = new AttendanceDTO.SummaryDTO();
        summary.setTotalRecords(total);
        summary.setPresentCount(present);
        summary.setLateCount(late);
        summary.setAbsentCount(absent);
        summary.setOverallPresentPercentage(total > 0
                ? Math.round((present * 100.0 / total) * 100) / 100.0
                : 0);
        return summary;
    }

    // ── Helpers ───────────────────────────────────────────────
    private String buildTimeSlot(Sprint sprint) {
        if (sprint.getSprintStart() != null && sprint.getSprintEnd() != null) {
            return sprint.getSprintStart() + " – " + sprint.getSprintEnd();
        }
        return "See sprint schedule";
    }

    AttendanceDTO toDTO(Attendance att) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(att.getId());
        dto.setSprintId(att.getSprint().getId());
        dto.setSprintTitle(att.getSprint().getTitle());
        dto.setEmployeeId(att.getEmployee().getId());
        dto.setEmpId(att.getEmployee().getEmpId());
        dto.setEmployeeName(att.getEmployee().getName());
        dto.setTechnology(att.getEmployee().getTechnology());
        dto.setCohort(att.getEmployee().getCohort());
        dto.setAttendanceDate(att.getAttendanceDate());
        dto.setStatus(att.getStatus());
        dto.setCheckInTime(att.getCheckInTime());
        dto.setNotes(att.getNotes());
        dto.setSubmitted(att.isSubmitted());
        dto.setCreatedAt(att.getCreatedAt());
        dto.setUpdatedAt(att.getUpdatedAt());
        return dto;
    }
}
