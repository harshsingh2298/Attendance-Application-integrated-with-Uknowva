package com.cms.attendance.cms_attendance_app.service;
import com.cms.attendance.cms_attendance_app.dto.*;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshRequest request);
}
