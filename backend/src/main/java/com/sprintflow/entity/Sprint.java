package com.sprintflow.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sprints")
@SQLDelete(sql = "UPDATE sprints SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 20)
    private String technology; // Java, Python, Devops, DotNet, SalesForce

    @Column(length = 50)
    private String cohort; // primary cohort (first pair)

    // Stored as JSON string: [{"technology":"Java","cohort":"Cohort A"},...]
    @Column(name = "cohorts_json", columnDefinition = "TEXT")
    private String cohortsJson;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(length = 100)
    private String room;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "sprint_start_time", length = 20)
    private String sprintStart; // e.g. 09:00 AM

    @Column(name = "sprint_end_time", length = 20)
    private String sprintEnd;   // e.g. 05:00 PM

    // Scheduled, On Hold, Completed
    @Column(nullable = false, length = 15)
    private String status = "Scheduled";

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Soft delete timestamp
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Sprint → enrolled employees (M:M via junction)
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SprintEmployee> enrollments;

    // Sprint → attendance records
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Attendance> attendanceRecords;

    public Sprint() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTechnology() { return technology; }
    public void setTechnology(String technology) { this.technology = technology; }

    public String getCohort() { return cohort; }
    public void setCohort(String cohort) { this.cohort = cohort; }

    public String getCohortsJson() { return cohortsJson; }
    public void setCohortsJson(String cohortsJson) { this.cohortsJson = cohortsJson; }

    public User getTrainer() { return trainer; }
    public void setTrainer(User trainer) { this.trainer = trainer; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getSprintStart() { return sprintStart; }
    public void setSprintStart(String sprintStart) { this.sprintStart = sprintStart; }

    public String getSprintEnd() { return sprintEnd; }
    public void setSprintEnd(String sprintEnd) { this.sprintEnd = sprintEnd; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    // Soft delete helper methods
    public boolean isDeleted() { return deletedAt != null; }
    public void markAsDeleted() { this.deletedAt = LocalDateTime.now(); }
    public void restore() { this.deletedAt = null; }

    public List<SprintEmployee> getEnrollments() { return enrollments; }
    public void setEnrollments(List<SprintEmployee> enrollments) { this.enrollments = enrollments; }

    public List<Attendance> getAttendanceRecords() { return attendanceRecords; }
    public void setAttendanceRecords(List<Attendance> attendanceRecords) { this.attendanceRecords = attendanceRecords; }
}
