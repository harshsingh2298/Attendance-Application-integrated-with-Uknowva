package com.cms.attendance.cms_attendance_app.repository;

import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, String> {
    Optional<Employee> findByEmail(String email);

    interface RoleRepository extends JpaRepository<Role, Long> {
        Optional<Role> findByRoleName(String roleName);
    }
}