package com.sprintflow.repository;

import com.sprintflow.entity.Role;
import com.sprintflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Only active users (used for login lookups, sprint trainer lists)
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.status = 'Active'")
    List<User> findByRole(Role role);

    // All users regardless of status (used by manager pages to show inactive too)
    @Query("SELECT u FROM User u WHERE u.role = ?1 ORDER BY u.status ASC, u.name ASC")
    List<User> findByRoleAll(Role role);

    @Query("SELECT u FROM User u WHERE u.status = 'Active'")
    List<User> findAllActive();

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByResetToken(String resetToken);
}
