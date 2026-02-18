package com.cms.attendance.cms_attendance_app.service;


import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.entity.RefreshToken;
import com.cms.attendance.cms_attendance_app.exceptions.ResourceNotFoundException;
import com.cms.attendance.cms_attendance_app.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshToken createRefreshToken(Employee employee, String tokenValue) {

        RefreshToken token = RefreshToken.builder()
                .token(tokenValue)
                .employee(employee)
                .expiryDate(Instant.now().plusSeconds(604800)) // 7 days
                .revoked(false)
                .build();

        return refreshTokenRepository.save(token);
    }

    public RefreshToken validateRefreshToken(String tokenValue) {

        RefreshToken token = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token not found"));

        if (token.isRevoked()) {
            throw new RuntimeException("Refresh token revoked");
        }

        if (token.getExpiryDate().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expired");
        }

        return token;
    }

    public void revokeAllEmployeeTokens(Employee employee) {
        refreshTokenRepository.deleteByEmployee(employee);
    }
}
