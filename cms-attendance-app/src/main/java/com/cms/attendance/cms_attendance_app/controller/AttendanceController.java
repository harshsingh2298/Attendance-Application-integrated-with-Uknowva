package com.cms.attendance.cms_attendance_app.controller;

import com.cms.attendance.cms_attendance_app.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/attendance")

public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/punch-in")
    public ResponseEntity<?> punchIn(Authentication auth) {
        return ResponseEntity.ok(
                attendanceService.punchIn(auth.getName())
        );
    }

    @PostMapping("/punch-out")
    public ResponseEntity<?> punchOut(Authentication auth) {
        return ResponseEntity.ok(
                attendanceService.punchOut(auth.getName())
        );
    }

    @GetMapping("/my")
    public ResponseEntity<?> my(Authentication auth) {
        return ResponseEntity.ok(
                attendanceService.getMyAttendance(auth.getName())
        );
    }

    @GetMapping("/senior")
    public ResponseEntity<?> senior(Authentication auth) {
        return ResponseEntity.ok(
                attendanceService.getSeniorAttendance(auth.getName())
        );
    }

    @GetMapping("/all")
    public ResponseEntity<?> all() {
        return ResponseEntity.ok(
                attendanceService.getAllAttendance()
        );
    }
}

