import { describe, it, expect } from "vitest";
import { evidenceVault } from "@/lib/evidence/evidence-vault";
import { EvidenceMetadata } from "@/types";

describe("Evidence Vault & Strict Ownership-Based Access Control", () => {
  const squadAUser = {
    id: "u_squad_A",
    role: "AUDIT_SQUAD",
    stateId: "AP",
  };

  const squadBUser = {
    id: "u_squad_B",
    role: "AUDIT_SQUAD",
    stateId: "AP",
  };

  const agencyAUser = {
    id: "u_agency_A",
    role: "AGENCY_PORTAL",
    organizationId: "ORG_AAA",
    stateId: "AP",
  };

  const agencyBUser = {
    id: "u_agency_B",
    role: "AGENCY_PORTAL",
    organizationId: "ORG_BBB",
    stateId: "AP",
  };

  const stateAdminAP = {
    id: "u_state_ap",
    role: "STATE_ADMIN",
    stateId: "AP",
  };

  const stateAdminMH = {
    id: "u_state_mh",
    role: "STATE_ADMIN",
    stateId: "MH",
  };

  const centralAdmin = {
    id: "u_central",
    role: "CENTRAL_ADMIN",
  };

  const squadAEvidence: EvidenceMetadata = {
    uuid: "EV-TEST-SQ-A",
    evidence_id: "EV-TEST-SQ-A",
    project_id: "P-101",
    owner_type: "AUDIT_SQUAD",
    owner_id: "SQUAD_A",
    owner_user_id: "u_squad_A",
    uploaded_by: "u_squad_A",
    uploaded_by_role: "AUDIT_SQUAD",
    state_id: "AP",
    type: "photo",
    filename: "squad_a_photo.jpg",
    file_size_bytes: 1024,
    sha256_hash: "AAAABBBBCCCCDDDD1111222233334444",
    captured_at: new Date().toISOString(),
    gps: { latitude: 16.3, longitude: 80.4, accuracy: 5, timestamp: new Date().toISOString() },
    visibility: "STATE_AUTHORIZED",
  };

  const agencyAEvidence: EvidenceMetadata = {
    uuid: "EV-TEST-AG-A",
    evidence_id: "EV-TEST-AG-A",
    project_id: "P-101",
    owner_type: "AGENCY",
    owner_id: "ORG_AAA",
    owner_organization_id: "ORG_AAA",
    owner_user_id: "u_agency_A",
    uploaded_by: "u_agency_A",
    uploaded_by_role: "AGENCY_PORTAL",
    state_id: "AP",
    type: "document",
    filename: "agency_a_report.pdf",
    file_size_bytes: 2048,
    sha256_hash: "555566667777888899990000AAAABBBB",
    captured_at: new Date().toISOString(),
    gps: { latitude: 16.3, longitude: 80.4, accuracy: 5, timestamp: new Date().toISOString() },
    visibility: "STATE_AUTHORIZED",
  };

  it("permits Audit Squad A to access its own uploaded evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(squadAUser, squadAEvidence)).toBe(true);
  });

  it("STRICTLY BLOCKS Audit Squad B from accessing Squad A's evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(squadBUser, squadAEvidence)).toBe(false);
  });

  it("permits Agency A to access its own organization evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(agencyAUser, agencyAEvidence)).toBe(true);
  });

  it("STRICTLY BLOCKS Agency B from accessing Agency A's evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(agencyBUser, agencyAEvidence)).toBe(false);
  });

  it("STRICTLY BLOCKS Agency from viewing Audit Squad private evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(agencyAUser, squadAEvidence)).toBe(false);
  });

  it("permits State Admin (AP) to access AP authorized evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(stateAdminAP, squadAEvidence)).toBe(true);
    expect(evidenceVault.canUserAccessEvidence(stateAdminAP, agencyAEvidence)).toBe(true);
  });

  it("BLOCKS State Admin (MH) from accessing AP state evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(stateAdminMH, squadAEvidence)).toBe(false);
  });

  it("permits Central Admin to access national authorized evidence", () => {
    expect(evidenceVault.canUserAccessEvidence(centralAdmin, squadAEvidence)).toBe(true);
    expect(evidenceVault.canUserAccessEvidence(centralAdmin, agencyAEvidence)).toBe(true);
  });
});
