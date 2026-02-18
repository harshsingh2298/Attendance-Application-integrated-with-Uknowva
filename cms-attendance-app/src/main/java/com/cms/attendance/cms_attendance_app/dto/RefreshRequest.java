package com.cms.attendance.cms_attendance_app.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefreshRequest {
    private String refreshToken;
}
