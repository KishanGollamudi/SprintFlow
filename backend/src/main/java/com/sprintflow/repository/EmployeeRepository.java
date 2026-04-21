package com.sprintflow.repository;

import com.sprintflow.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmpId(String empId);

    boolean existsByEmpId(String empId);

    boolean existsByEmail(String email);

    List<Employee> findByTechnology(String technology);

    List<Employee> findByCohort(String cohort);

    List<Employee> findByTechnologyAndCohort(String technology, String cohort);

    List<Employee> findByStatus(String status);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', ?1, '%')) OR LOWER(e.empId) LIKE LOWER(CONCAT('%', ?1, '%'))")
    List<Employee> searchByKeyword(String keyword);

    @Query("SELECT e FROM Employee e WHERE e.technology = ?1 AND e.cohort = ?2 AND e.status = 'Active'")
    List<Employee> findActiveByTechnologyAndCohort(String technology, String cohort);
}
