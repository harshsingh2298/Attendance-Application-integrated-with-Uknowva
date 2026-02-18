package com.cms.attendance.cms_attendance_app.repository;

import com.cms.attendance.cms_attendance_app.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import com.cms.attendance.cms_attendance_app.entity.RefreshToken;
import com.cms.attendance.cms_attendance_app.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByEmployee(Employee employee);
}

