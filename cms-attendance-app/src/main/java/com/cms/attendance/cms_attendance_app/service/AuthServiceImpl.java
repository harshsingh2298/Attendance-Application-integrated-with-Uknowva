package com.cms.attendance.cms_attendance_app.service;



import com.cms.attendance.cms_attendance_app.dto.*;
import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.entity.RefreshToken;
import com.cms.attendance.cms_attendance_app.exceptions.CustomException;
import com.cms.attendance.cms_attendance_app.repository.EmployeeRepository;
import com.cms.attendance.cms_attendance_app.repository.RefreshTokenRepository;
import com.cms.attendance.cms_attendance_app.security.JwtUtil;
import com.cms.attendance.cms_attendance_app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service

public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final EmployeeRepository employeeRepository;
    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;


    public AuthServiceImpl(AuthenticationManager authenticationManager, EmployeeRepository employeeRepository, JwtUtil jwtUtil, RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.employeeRepository = employeeRepository;
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Employee employee = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found"));

        String accessToken = jwtUtil.generateAccessToken(employee);

        String refreshToken = UUID.randomUUID().toString();

        RefreshToken token = RefreshToken.builder()
                .token(refreshToken)
                .employee(employee)
                .expiryDate(Instant.now().plusSeconds(604800))
                .revoked(false)
                .build();

        refreshTokenRepository.save(token);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .empCode(employee.getEmpCode())
                .role(employee.getRoles().iterator().next().getRoleName())
                .build();
    }

    @Override
    public AuthResponse refreshToken(RefreshRequest request) {

        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new CustomException("Invalid refresh token"));

        if (token.isRevoked() || token.getExpiryDate().isBefore(Instant.now())) {
            throw new CustomException("Refresh token expired");
        }

        Employee employee = token.getEmployee();
        String newAccessToken = jwtUtil.generateAccessToken(employee);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(request.getRefreshToken())
                .empCode(employee.getEmpCode())
                .role(employee.getRoles().iterator().next().getRoleName())
                .build();
    }
}

