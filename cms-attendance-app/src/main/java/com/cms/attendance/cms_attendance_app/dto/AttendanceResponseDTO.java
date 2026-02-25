package com.cms.attendance.cms_attendance_app.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceResponseDTO {
    private LocalDate date;
    private LocalDateTime punchIn;
    private LocalDateTime punchOut;
    private Double totalHours;
    private String status;
    private String location;
}

