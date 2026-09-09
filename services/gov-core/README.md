# NIRNAY Enterprise Gov Core (Java / Spring Boot)

This service manages enterprise compliance, scheme tracking, and high-trust government integrations:

- **DoSJE Scheme Registry (`/api/v1/dosje/schemes`)**: Tracks PM-AJAY, SMILE, NMBA, and SRMS targets, budgets, and compliance ratios.
- **PFMS Disbursement Gate (`/api/v1/pfms/validate-disbursement`)**: Blocks Direct Benefit Transfer (DBT) grant release if biometric integrity or CCTV occupancy falls below the 85% threshold.

## Running Locally

Requirements: Java 21 LTS & Maven 3.9+

```bash
cd services/gov-core
mvn spring-boot:run
# Runs on http://localhost:8080
```

## Running with Docker

```bash
docker build -t nirnay-gov-core .
docker run -p 8080:8080 nirnay-gov-core
```
