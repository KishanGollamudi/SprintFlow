package com.sprintflow.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sprintflow.dto.SprintDTO;
import com.sprintflow.entity.Sprint;
import com.sprintflow.entity.User;
import com.sprintflow.exception.ResourceNotFoundException;
import com.sprintflow.repository.EmployeeRepository;
import com.sprintflow.repository.SprintRepository;
import com.sprintflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SprintService {

    @Autowired private SprintRepository  sprintRepository;
    @Autowired private UserRepository    userRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private ObjectMapper      objectMapper;

    // ── Queries ───────────────────────────────────────────────

    public List<SprintDTO> getAllSprints() {
        return sprintRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public SprintDTO getSprintById(Long id) {
        return toDTO(sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + id)));
    }

    public List<SprintDTO> getSprintsByStatus(String status) {
        return sprintRepository.findByStatus(status).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<SprintDTO> getSprintsForTrainer(Long trainerId) {
        return sprintRepository.findByTrainerId(trainerId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Mutations ─────────────────────────────────────────────

    public SprintDTO createSprint(SprintDTO dto, Long createdByUserId) {
        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + createdByUserId));

        Sprint sprint = new Sprint();
        mapDtoToEntity(dto, sprint);
        sprint.setCreatedBy(createdBy);
        sprint.setStatus("Scheduled");
        sprint.setCreatedAt(LocalDateTime.now());
        sprint.setUpdatedAt(LocalDateTime.now());

        resolveTrainer(dto, sprint);
        return toDTO(sprintRepository.save(sprint));
    }

    public SprintDTO updateSprint(Long id, SprintDTO dto) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + id));
        mapDtoToEntity(dto, sprint);
        resolveTrainer(dto, sprint);
        sprint.setUpdatedAt(LocalDateTime.now());
        return toDTO(sprintRepository.save(sprint));
    }

    public SprintDTO updateStatus(Long id, String status) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + id));
        sprint.setStatus(status);
        sprint.setUpdatedAt(LocalDateTime.now());
        return toDTO(sprintRepository.save(sprint));
    }

    public void deleteSprint(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + id));
        sprintRepository.delete(sprint);
    }

    // ── Trainer conflict check ────────────────────────────────

    /**
     * Returns sprints for the given trainer whose date range AND daily time slot
     * overlap with the proposed sprint. Empty list = no conflict.
     *
     * Date overlap:  startA <= endB AND endA >= startB
     * Time overlap:  startA < endB  AND endA > startB  (minutes since midnight)
     *
     * @param excludeId sprint ID to skip (edit flow) — pass null for create
     */
    public List<SprintDTO> checkTrainerConflict(
            Long trainerId,
            LocalDate startDate,
            LocalDate endDate,
            String sprintStart,
            String sprintEnd,
            Long excludeId) {

        List<Sprint> dateCandidates = sprintRepository.findTrainerOverlappingSprints(
                trainerId, startDate, endDate, excludeId);

        if (dateCandidates.isEmpty()) return Collections.emptyList();

        int propStart = parseTimeToMinutes(sprintStart);
        int propEnd   = parseTimeToMinutes(sprintEnd);

        // If times can't be parsed, return all date-overlapping sprints as conflicts
        if (propStart < 0 || propEnd < 0)
            return dateCandidates.stream().map(this::toDTO).collect(Collectors.toList());

        return dateCandidates.stream()
                .filter(s -> {
                    int exStart = parseTimeToMinutes(s.getSprintStart());
                    int exEnd   = parseTimeToMinutes(s.getSprintEnd());
                    if (exStart < 0 || exEnd < 0) return true; // unparseable = assume conflict
                    return propStart < exEnd && propEnd > exStart;
                })
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Parse "HH:MM AM" or "HH:MM PM" to minutes since midnight.
     * Returns -1 if null, blank, or unparseable.
     */
    private int parseTimeToMinutes(String time) {
        if (time == null || time.isBlank()) return -1;
        try {
            String t   = time.trim().toUpperCase();
            boolean pm = t.endsWith("PM");
            boolean am = t.endsWith("AM");
            String[] parts = t.replace("AM", "").replace("PM", "").trim().split(":");
            int h = Integer.parseInt(parts[0].trim());
            int m = Integer.parseInt(parts[1].trim());
            if (pm && h != 12) h += 12;
            if (am && h == 12) h = 0;
            return h * 60 + m;
        } catch (Exception e) {
            return -1;
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    /** Resolve trainer entity from DTO name or ID and set on sprint. */
    private void resolveTrainer(SprintDTO dto, Sprint sprint) {
        if (dto.getTrainer() != null && !dto.getTrainer().isBlank()) {
            userRepository.findAll().stream()
                    .filter(u -> u.getName().equalsIgnoreCase(dto.getTrainer()))
                    .findFirst()
                    .ifPresent(sprint::setTrainer);
        } else if (dto.getTrainerId() != null) {
            userRepository.findById(dto.getTrainerId()).ifPresent(sprint::setTrainer);
        }
    }

    private void mapDtoToEntity(SprintDTO dto, Sprint sprint) {
        if (dto.getTitle()       != null) sprint.setTitle(dto.getTitle());
        if (dto.getTechnology()  != null) sprint.setTechnology(dto.getTechnology());
        if (dto.getCohort()      != null) sprint.setCohort(dto.getCohort());
        if (dto.getRoom()        != null) sprint.setRoom(dto.getRoom());
        if (dto.getStartDate()   != null) sprint.setStartDate(dto.getStartDate());
        if (dto.getEndDate()     != null) sprint.setEndDate(dto.getEndDate());
        if (dto.getSprintStart() != null) sprint.setSprintStart(dto.getSprintStart());
        if (dto.getSprintEnd()   != null) sprint.setSprintEnd(dto.getSprintEnd());
        if (dto.getStatus()      != null) sprint.setStatus(dto.getStatus());
        if (dto.getInstructions()!= null) sprint.setInstructions(dto.getInstructions());

        if (dto.getCohorts() != null && !dto.getCohorts().isEmpty()) {
            try {
                sprint.setCohortsJson(objectMapper.writeValueAsString(dto.getCohorts()));
                sprint.setCohort(dto.getCohorts().get(0).getCohort());
                sprint.setTechnology(dto.getCohorts().get(0).getTechnology());
            } catch (Exception ignored) {}
        }
    }

    SprintDTO toDTO(Sprint sprint) {
        SprintDTO dto = new SprintDTO();
        dto.setId(sprint.getId());
        dto.setTitle(sprint.getTitle());
        dto.setTechnology(sprint.getTechnology());
        dto.setCohort(sprint.getCohort());
        dto.setRoom(sprint.getRoom());
        dto.setStartDate(sprint.getStartDate());
        dto.setEndDate(sprint.getEndDate());
        dto.setSprintStart(sprint.getSprintStart());
        dto.setSprintEnd(sprint.getSprintEnd());
        dto.setStatus(sprint.getStatus());
        dto.setInstructions(sprint.getInstructions());
        dto.setCreatedAt(sprint.getCreatedAt());
        dto.setUpdatedAt(sprint.getUpdatedAt());

        if (sprint.getSprintStart() != null && sprint.getSprintEnd() != null)
            dto.setTimeSlot(sprint.getSprintStart() + " - " + sprint.getSprintEnd());

        if (sprint.getTrainer() != null) {
            dto.setTrainerId(sprint.getTrainer().getId());
            dto.setTrainer(sprint.getTrainer().getName());
        }

        if (sprint.getCohortsJson() != null) {
            try {
                List<SprintDTO.CohortPair> pairs = objectMapper.readValue(
                        sprint.getCohortsJson(), new TypeReference<List<SprintDTO.CohortPair>>() {});
                dto.setCohorts(pairs);
            } catch (Exception ignored) {}
        }
        if (dto.getCohorts() == null && sprint.getTechnology() != null && sprint.getCohort() != null) {
            dto.setCohorts(Collections.singletonList(
                    new SprintDTO.CohortPair(sprint.getTechnology(), sprint.getCohort())));
        }

        int count = 0;
        List<SprintDTO.CohortPair> pairs = dto.getCohorts() != null ? dto.getCohorts() : Collections.emptyList();
        for (SprintDTO.CohortPair pair : pairs) {
            if (pair.getTechnology() != null && pair.getCohort() != null) {
                count += employeeRepository.findActiveByTechnologyAndCohort(
                        pair.getTechnology(), pair.getCohort()).size();
            }
        }
        dto.setEmployeeCount(count);

        return dto;
    }
}
