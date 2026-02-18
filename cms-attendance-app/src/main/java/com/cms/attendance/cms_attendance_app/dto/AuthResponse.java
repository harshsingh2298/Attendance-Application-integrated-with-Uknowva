package com.cms.attendance.cms_attendance_app.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String role;
    private String empCode;
}