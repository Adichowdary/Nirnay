package in.gov.dosje.nirnay.controller;

import in.gov.dosje.nirnay.service.DutyRandomizerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1")
public class InspectionAssignmentController {

    private final DutyRandomizerService dutyRandomizerService;

    public InspectionAssignmentController(DutyRandomizerService dutyRandomizerService) {
        this.dutyRandomizerService = dutyRandomizerService;
    }

    @PostMapping("/assign/inspection")
    public ResponseEntity<Map<String, Object>> assignInspection(@RequestBody Map<String, Object> req) {
        String instituteId = (String) req.getOrDefault("instituteId", "INST-UP-2024-8819");
        String instituteName = (String) req.getOrDefault("instituteName", "Dr. Ambedkar Hostel & Training Center");
        String district = (String) req.getOrDefault("district", "Lucknow");
        String riskLevel = (String) req.getOrDefault("riskLevel", "HIGH");

        Map<String, Object> assignment = dutyRandomizerService.assignRandomDuty(
            instituteId, instituteName, district, riskLevel
        );

        return ResponseEntity.ok(assignment);
    }
}
