package com.cms.attendance.cms_attendance_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attendanceId;

    @ManyToOne
    @JoinColumn(name = "emp_id")
    private Employee employee;

    private LocalDate attendanceDate;

    private LocalDateTime punchIn;

    private LocalDateTime punchOut;

    private Double totalHours;

    private String status;

    private String location;
}
