package com.cms.attendance.cms_attendance_app.config;

import com.cms.attendance.cms_attendance_app.entity.Attendance;
import com.cms.attendance.cms_attendance_app.entity.Employee;
import com.cms.attendance.cms_attendance_app.entity.Role;
import com.cms.attendance.cms_attendance_app.repository.AttendanceRepository;
import com.cms.attendance.cms_attendance_app.repository.EmployeeRepository;
import com.cms.attendance.cms_attendance_app.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.*;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (employeeRepository.count() > 0) return; // Already seeded

        // ─── Roles ───────────────────────────────────────────
        Role empRole  = getOrCreateRole("ROLE_EMPLOYEE");
        Role mgrRole  = getOrCreateRole("ROLE_MANAGER");
        Role adminRole= getOrCreateRole("ROLE_ADMIN");

        String pass = passwordEncoder.encode("password123");

        // ─── Managers ────────────────────────────────────────
        Employee mgr1 = buildEmp("MGR001","Ravi","Krishnan","manager@cms.com",pass,"Engineering","CMS Digital Lounge",null, Set.of(mgrRole));
        Employee mgr2 = buildEmp("MGR002","Sunita","Bose","sunita.mgr@cms.com",pass,"Operations","Ops Excellence",null, Set.of(mgrRole));

        // ─── Admin ────────────────────────────────────────────
        Employee admin = buildEmp("ADM001","Harsh","Raghuvanshi","admin@cms.com",pass,"Administration","All Projects",null, Set.of(adminRole));

        // ─── Employees ───────────────────────────────────────
        List<Employee> emps = List.of(
            buildEmp("EMP001","Arjun","Sharma","emp@cms.com",pass,"Engineering","CMS Digital Lounge","MGR001",Set.of(empRole)),
            buildEmp("EMP002","Priya","Patel","priya@cms.com",pass,"Engineering","HR Portal","MGR001",Set.of(empRole)),
            buildEmp("EMP003","Rohan","Verma","rohan@cms.com",pass,"Engineering","Payroll System","MGR001",Set.of(empRole)),
            buildEmp("EMP004","Sneha","Nair","sneha@cms.com",pass,"QA","Attendance Sync","MGR001",Set.of(empRole)),
            buildEmp("EMP005","Kiran","Reddy","kiran@cms.com",pass,"DevOps","CI/CD Pipeline","MGR001",Set.of(empRole)),
            buildEmp("EMP006","Amit","Kumar","amit@cms.com",pass,"Engineering","Mediclaim Portal","MGR002",Set.of(empRole)),
            buildEmp("EMP007","Divya","Singh","divya@cms.com",pass,"Design","UI Revamp","MGR002",Set.of(empRole)),
            buildEmp("EMP008","Rahul","Joshi","rahul@cms.com",pass,"Engineering","SSO Integration","MGR002",Set.of(empRole)),
            buildEmp("EMP009","Pooja","Mehta","pooja@cms.com",pass,"HR","Employee Self-Serve","MGR002",Set.of(empRole)),
            buildEmp("EMP010","Varun","Gupta","varun@cms.com",pass,"Engineering","API Gateway","MGR001",Set.of(empRole)),
            buildEmp("EMP011","Anjali","Iyer","anjali@cms.com",pass,"Engineering","Mobile App","MGR002",Set.of(empRole)),
            buildEmp("EMP012","Suresh","Rao","suresh@cms.com",pass,"Security","OAuth Platform","MGR001",Set.of(empRole)),
            buildEmp("EMP013","Meera","Pillai","meera@cms.com",pass,"Engineering","CMS Digital Lounge","MGR002",Set.of(empRole))
        );

        List<Employee> allToSave = new ArrayList<>();
        allToSave.add(mgr1); allToSave.add(mgr2); allToSave.add(admin);
        allToSave.addAll(emps);
        employeeRepository.saveAll(allToSave);

        // ─── Attendance ─────────────────────────────────────
//        List<String[]> statuses = List.of(
//            new String[]{"PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","LATE","WFH","HALF_DAY","ABSENT"}
//        );
        String[] statusArr = {"PRESENT","PRESENT","PRESENT","PRESENT","PRESENT","LATE","WFH","HALF_DAY","ABSENT"};
        String[] locations = {"Bangalore Office","Bangalore Office","Client Site","Bangalore Office","Work From Home"};

        LocalDate now = LocalDate.now();
        int year = now.getYear(), month = now.getMonthValue();
        int today = now.getDayOfMonth();

        Random rnd = new Random(42);
        List<Attendance> attendanceList = new ArrayList<>();

        for (Employee emp : allToSave) {
            for (int d = 1; d <= today; d++) {
                LocalDate date = LocalDate.of(year, month, d);
                DayOfWeek dow = date.getDayOfWeek();
                if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;

                String status = statusArr[rnd.nextInt(statusArr.length)];
                String loc = status.equals("WFH") ? "Work From Home" : locations[rnd.nextInt(locations.length)];

                int punchHour = status.equals("LATE") ? (10 + rnd.nextInt(2)) : (8 + rnd.nextInt(2));
                int punchMin  = rnd.nextInt(60);
                int outHour   = status.equals("HALF_DAY") ? punchHour + 4 : punchHour + 7 + rnd.nextInt(3);
                int outMin    = rnd.nextInt(60);

                LocalDateTime punchIn  = status.equals("ABSENT") ? null : LocalDateTime.of(year, month, d, punchHour, punchMin);
                LocalDateTime punchOut = status.equals("ABSENT") ? null : LocalDateTime.of(year, month, d, Math.min(outHour,23), outMin);

                double totalHours = 0;
                if (punchIn != null && punchOut != null) {
                    totalHours = Math.round(Duration.between(punchIn, punchOut).toMinutes() / 6.0) / 10.0;
                }

                Attendance att = Attendance.builder()
                        .employee(emp)
                        .attendanceDate(date)
                        .punchIn(punchIn)
                        .punchOut(punchOut)
                        .totalHours(totalHours)
                        .status(status)
                        .location(loc)
                        .build();
                attendanceList.add(att);
            }
        }
        attendanceRepository.saveAll(attendanceList);
        System.out.println("✅ DataSeeder: Inserted " + allToSave.size() + " employees and " + attendanceList.size() + " attendance records.");
    }

    private Role getOrCreateRole(String name) {
        return roleRepository.findByRoleName(name)
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setRoleName(name);
                    return roleRepository.save(r);
                });
    }

    private Employee buildEmp(String code, String first, String last, String email,
                               String pass, String dept, String project, String seniorId, Set<Role> roles) {
        Employee e = new Employee();
        e.setEmpCode(code); e.setFirstName(first); e.setLastName(last);
        e.setEmail(email); e.setPassword(pass); e.setDepartment(dept);
        e.setProject(project); e.setSeniorId(seniorId); e.setStatus(true);
        e.setRoles(roles);
        return e;
    }
}
