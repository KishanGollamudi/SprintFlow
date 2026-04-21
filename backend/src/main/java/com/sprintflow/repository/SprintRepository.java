package com.sprintflow.repository;

import com.sprintflow.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findByStatus(String status);

    List<Sprint> findByTrainerId(Long trainerId);

    @Query("SELECT s FROM Sprint s WHERE s.trainer.id = ?1 AND s.status = ?2")
    List<Sprint> findByTrainerIdAndStatus(Long trainerId, String status);

    @Query("SELECT s FROM Sprint s WHERE s.technology = ?1")
    List<Sprint> findByTechnology(String technology);

    @Query("SELECT s FROM Sprint s WHERE s.status IN ('Scheduled', 'On Hold') ORDER BY s.startDate ASC")
    List<Sprint> findActiveOrUpcoming();

    // Find sprints for a trainer whose date range overlaps with the given range
    // Used for trainer time-slot conflict checking
    @Query("SELECT s FROM Sprint s WHERE s.trainer.id = :trainerId " +
           "AND s.status != 'Completed' " +
           "AND s.startDate <= :endDate " +
           "AND s.endDate >= :startDate " +
           "AND (:excludeId IS NULL OR s.id != :excludeId)")
    List<Sprint> findTrainerOverlappingSprints(
            @org.springframework.data.repository.query.Param("trainerId")  Long trainerId,
            @org.springframework.data.repository.query.Param("startDate")  java.time.LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate")    java.time.LocalDate endDate,
            @org.springframework.data.repository.query.Param("excludeId")  Long excludeId);
}
