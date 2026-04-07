package com.cms.attendance.cms_attendance_app.service;
import com.cms.attendance.cms_attendance_app.entity.Attendance;
import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.exceptions.CustomException;
import com.cms.attendance.cms_attendance_app.repository.AttendanceRepository;
import com.cms.attendance.cms_attendance_app.repository.EmployeeRepository;
import com.cms.attendance.cms_attendance_app.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public Attendance punchIn(String empCode) {

        LocalDate today = LocalDate.now();

        if (attendanceRepository.findByEmployeeEmpCodeAndAttendanceDate(empCode, today).isPresent()) {
            throw new CustomException("Already punched in today");
        }

        Employee employee = employeeRepository.findById(empCode)
                .orElseThrow(() -> new CustomException("Employee not found"));

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(today)
                .punchIn(LocalDateTime.now())
                .status("PRESENT")
                .build();

        return attendanceRepository.save(attendance);
    }

    @Override
    public Attendance punchOut(String empCode) {

        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository
                .findByEmployeeEmpCodeAndAttendanceDate(empCode, today)
                .orElseThrow(() -> new CustomException("Punch in first"));

        attendance.setPunchOut(LocalDateTime.now());

        Duration duration = Duration.between(attendance.getPunchIn(), attendance.getPunchOut());
        attendance.setTotalHours(duration.toMinutes() / 60.0);

        return attendanceRepository.save(attendance);
    }

    @Override
    public List<Attendance> getMyAttendance(String empCode) {
        return attendanceRepository.findByEmployeeEmpCode(empCode);
    }

    @Override
    public List<Attendance> getSeniorAttendance(String seniorId) {
        return attendanceRepository.findByEmployeeSeniorId(seniorId);
    }

    @Override
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }


}
