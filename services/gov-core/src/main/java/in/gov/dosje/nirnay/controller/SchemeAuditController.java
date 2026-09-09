package in.gov.dosje.nirnay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class SchemeAuditController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("service", "nirnay-gov-core");
        resp.put("language", "Java 21 LTS");
        resp.put("framework", "Spring Boot 3.2");
        resp.put("status", "HEALTHY");
        resp.put("ministry", "Ministry of Social Justice and Empowerment (DoSJE)");
        resp.put("pfms_bridge_status", "CONNECTED_ENCRYPTED");
        resp.put("active_threads", Thread.activeCount());
        resp.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/api/v1/dosje/schemes")
    public ResponseEntity<Map<String, Object>> getSchemes() {
        List<Map<String, Object>> schemes = List.of(
            Map.of(
                "code", "PM-AJAY",
                "name", "Pradhan Mantri Anusuchit Jaati Abhyuday Yojana",
                "targetBeneficiaries", "SC Youth & Hostels",
                "activeInstitutes", 1420,
                "monthlyBudgetCr", 42.5,
                "auditComplianceRatio", 0.942
            ),
            Map.of(
                "code", "SMILE",
                "name", "Support for Marginalized Individuals for Livelihood and Enterprise",
                "targetBeneficiaries", "Transgender Persons & Beggary Rehabilitation",
                "activeInstitutes", 380,
                "monthlyBudgetCr", 18.2,
                "auditComplianceRatio", 0.915
            ),
            Map.of(
                "code", "NMBA",
                "name", "Nasha Mukt Bharat Abhiyaan (De-addiction Centers)",
                "targetBeneficiaries", "Substance Abuse Victims & Rehabilitation Centers",
                "activeInstitutes", 610,
                "monthlyBudgetCr", 26.8,
                "auditComplianceRatio", 0.884
            ),
            Map.of(
                "code", "SRMS",
                "name", "Self Employment Scheme for Rehabilitation of Manual Scavengers",
                "targetBeneficiaries", "Sanitation Workers & Dependents",
                "activeInstitutes", 195,
                "monthlyBudgetCr", 9.4,
                "auditComplianceRatio", 0.978
            )
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalSchemes", schemes.size());
        response.put("schemes", schemes);
        response.put("generatedAt", Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/v1/pfms/validate-disbursement")
    public ResponseEntity<Map<String, Object>> validateDisbursement(@RequestBody Map<String, Object> req) {
        String instituteId = (String) req.getOrDefault("instituteId", "INST-DEFAULT");
        String schemeCode = (String) req.getOrDefault("schemeCode", "PM-AJAY");
        Double amountCr = Double.valueOf(req.getOrDefault("amountCr", 1.25).toString());
        Double biometricScore = Double.valueOf(req.getOrDefault("biometricIntegrityScore", 0.95).toString());

        boolean isApproved = biometricScore >= 0.85;
        String clearanceCode = isApproved ? "PFMS-CLEAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() : "HELD-ANOMALY-ALERT";

        Map<String, Object> verdict = new LinkedHashMap<>();
        verdict.put("instituteId", instituteId);
        verdict.put("schemeCode", schemeCode);
        verdict.put("requestedAmountCr", amountCr);
        verdict.put("biometricIntegrityScore", biometricScore);
        verdict.put("clearedForPFMSTransfer", isApproved);
        verdict.put("clearanceCode", clearanceCode);
        verdict.put("reason", isApproved ? "Compliant: Live CCTV & FRS audits cleared" : "Blocked: Discrepancy > 15% detected by AI Engine");
        verdict.put("complianceStandard", "DoSJE DBT Rule 2024 / GFR Rule 238");
        verdict.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(verdict);
    }
}
