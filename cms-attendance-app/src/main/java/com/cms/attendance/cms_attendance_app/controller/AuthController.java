package com.cms.attendance.cms_attendance_app.controller;

import com.cms.attendance.cms_attendance_app.dto.ApiResponse;
import com.cms.attendance.cms_attendance_app.dto.AuthResponse;
import com.cms.attendance.cms_attendance_app.dto.LoginRequest;
import com.cms.attendance.cms_attendance_app.dto.RefreshRequest;
import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.entity.RefreshToken;
import com.cms.attendance.cms_attendance_app.exceptions.ResourceNotFoundException;
import com.cms.attendance.cms_attendance_app.repository.EmployeeRepository;
import com.cms.attendance.cms_attendance_app.repository.RefreshTokenRepository;
import com.cms.attendance.cms_attendance_app.security.JwtUtil;
import com.cms.attendance.cms_attendance_app.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")

public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    private final AuthService authService;
    private final EmployeeRepository employeeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil, AuthService authService, EmployeeRepository employeeRepository, RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.authService = authService;
        this.employeeRepository = employeeRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, String>>> login(
            @RequestBody LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Employee employee = employeeRepository
                .findByEmail(request.getEmail())
                .orElseThrow();

        String accessToken = jwtUtil.generateAccessToken(employee);
        String refreshToken = jwtUtil.generateRefreshToken(employee);

        RefreshToken token = new RefreshToken();
        token.setEmployee(employee);
        token.setToken(refreshToken);
        token.setExpiryDate(Instant.now().plusSeconds(604800));

        refreshTokenRepository.save(token);

        Map<String, String> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Login successful", response)

        );
    }


    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }


    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshRequest request) {

        RefreshToken token = refreshTokenRepository
                .findByToken(request.getRefreshToken())
                .orElseThrow(() -> new ResourceNotFoundException("Token not found"));

        token.setRevoked(true);
        refreshTokenRepository.save(token);

        return ResponseEntity.ok("Logged out successfully");
    }


}
