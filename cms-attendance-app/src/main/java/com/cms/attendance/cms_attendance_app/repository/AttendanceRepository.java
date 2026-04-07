package com.cms.attendance.cms_attendance_app.repository;

import com.cms.attendance.cms_attendance_app.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeEmpCodeAndAttendanceDate(String empCode, LocalDate date);

    List<Attendance> findByEmployeeEmpCode(String empCode);



    List<Attendance> findByEmployeeSeniorId(String seniorId);
}
