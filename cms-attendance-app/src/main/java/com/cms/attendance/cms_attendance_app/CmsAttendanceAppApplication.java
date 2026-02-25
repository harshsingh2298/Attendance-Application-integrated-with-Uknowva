package com.cms.attendance.cms_attendance_app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication

public class CmsAttendanceAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(CmsAttendanceAppApplication.class, args);

		System.out.println(new BCryptPasswordEncoder().encode("employee123"));
		System.out.println(new BCryptPasswordEncoder().encode("admin123"));
		System.out.println(new BCryptPasswordEncoder().encode("manager123"));



	}

}
