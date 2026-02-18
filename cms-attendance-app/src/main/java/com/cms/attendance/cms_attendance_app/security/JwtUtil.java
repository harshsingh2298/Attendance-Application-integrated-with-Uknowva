package com.cms.attendance.cms_attendance_app.security;


import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.entity.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.*;
import java.util.stream.Collectors;




@Component
public class JwtUtil {

    private final String SECRET = "my_super_secret_key_my_super_secret_key_12345";

    private final long ACCESS_EXPIRATION = 1000 * 60 * 15;     // 15 minutes
    private final long REFRESH_EXPIRATION = 1000L * 60 * 60 * 24 * 7; // 7 days

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    /* ===========================
       ACCESS TOKEN
       =========================== */

    public String generateAccessToken(Employee employee) {

        Map<String, Object> claims = new HashMap<>();

        claims.put("roles",
                employee.getRoles()
                        .stream()
                        .map(Role::getRoleName)
                        .collect(Collectors.toList())
        );

        claims.put("empCode", employee.getEmpCode());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(employee.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_EXPIRATION))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /* ===========================
       REFRESH TOKEN
       =========================== */

    public String generateRefreshToken(Employee employee) {

        return Jwts.builder()
                .setSubject(employee.getEmail())
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /* ===========================
       VALIDATION
       =========================== */

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
