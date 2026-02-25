package com.cms.attendance.cms_attendance_app.controller;

import com.cms.attendance.cms_attendance_app.service.AttendanceService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PreAuthorize("hasRole('EMPLOYEE')")
    @PostMapping("/punch-in")
    public ResponseEntity<?> punchIn(@Parameter(hidden = true) Authentication auth
    ) {
        return ResponseEntity.ok(attendanceService.punchIn(auth.getName()));
    }

    @PreAuthorize("hasRole('EMPLOYEE')")
    @PostMapping("/punch-out")
    public ResponseEntity<?> punchOut(Authentication auth) {
        return ResponseEntity.ok(attendanceService.punchOut(auth.getName()));
    }

    @PreAuthorize("hasRole('EMPLOYEE')")
    @GetMapping("/my")
    public ResponseEntity<?> my(Authentication auth) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(auth.getName()));
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/senior")
    public ResponseEntity<?> senior(Authentication auth) {
        return ResponseEntity.ok(attendanceService.getSeniorAttendance(auth.getName()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<?> all() {
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }
}


