package com.cms.attendance.cms_attendance_app.service;

import com.cms.attendance.cms_attendance_app.entity.Attendance;

import java.util.List;

public interface AttendanceService {
    Attendance punchIn(String empCode);
    Attendance punchOut(String empCode);
    List<Attendance> getMyAttendance(String empCode);
    List<Attendance> getSeniorAttendance(String seniorId);
    List<Attendance> getAllAttendance();
    List<Attendance> getAttendanceByEmpCode(String empCode); // NEW: search by empCode
}
