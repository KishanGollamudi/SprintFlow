package com.sprintflow.repository;

import com.sprintflow.entity.SprintEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintEmployeeRepository extends JpaRepository<SprintEmployee, Long> {

    List<SprintEmployee> findBySprintId(Long sprintId);

    List<SprintEmployee> findByEmployeeId(Long employeeId);

    Optional<SprintEmployee> findBySprintIdAndEmployeeId(Long sprintId, Long employeeId);

    boolean existsBySprintIdAndEmployeeId(Long sprintId, Long employeeId);

    void deleteBySprintIdAndEmployeeId(Long sprintId, Long employeeId);
}
