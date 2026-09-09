export interface BiometricCollisionRecord {
  id: string;
  clusterId: string;
  beneficiaryName: string;
  primaryCenter: string;
  primaryState: string;
  conflictingCenter: string;
  conflictingState: string;
  faceSimilarityScore: number;
  aadhaarHashCollision: boolean;
  claimedMonthlyStipend: number;
  lastSimultaneousCheckIn: string;
  riskSeverity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE_FLAG" | "UNDER_REVIEW" | "PAYMENT_FROZEN" | "DISMISSED";
  detectedAt: string;
}

export interface GrantDisbursementAnomaly {
  projectId: string;
  projectName: string;
  schemeName: string;
  allocatedBudget: number; // in INR Lakhs
  disbursedAmount: number; // in INR Lakhs
  verifiedPhysicalProgress: number; // percentage (e.g., 42%)
  claimedProgress: number; // percentage (e.g., 85%)
  financialDivergenceLakhs: number;
  riskStatus: "HIGH_EXPOSURE" | "MODERATE" | "COMPLIANT";
}

export const DEMO_BIOMETRIC_COLLISIONS: BiometricCollisionRecord[] = [
  {
    id: "BIO-COL-101",
    clusterId: "CLUST-JP-JD-88",
    beneficiaryName: "Ramesh Kumar Verma",
    primaryCenter: "Asha Rehabilitation Centre (Jaipur)",
    primaryState: "Rajasthan",
    conflictingCenter: "Pragati Skill Training Institute (Jodhpur)",
    conflictingState: "Rajasthan",
    faceSimilarityScore: 0.984,
    aadhaarHashCollision: true,
    claimedMonthlyStipend: 4500,
    lastSimultaneousCheckIn: "Today, 09:15 AM (Simultaneous Check-in 310km apart)",
    riskSeverity: "CRITICAL",
    status: "PAYMENT_FROZEN",
    detectedAt: "2026-09-02T09:18:22Z",
  },
  {
    id: "BIO-COL-102",
    clusterId: "CLUST-UP-DL-14",
    beneficiaryName: "Sunita Devi Sharma",
    primaryCenter: "Samarth Divyang Hostel (Noida)",
    primaryState: "Uttar Pradesh",
    conflictingCenter: "Udaan Skill Academy (Delhi East)",
    conflictingState: "Delhi NCR",
    faceSimilarityScore: 0.961,
    aadhaarHashCollision: true,
    claimedMonthlyStipend: 5200,
    lastSimultaneousCheckIn: "Yesterday, 10:30 AM",
    riskSeverity: "HIGH",
    status: "ACTIVE_FLAG",
    detectedAt: "2026-09-01T14:45:10Z",
  },
  {
    id: "BIO-COL-103",
    clusterId: "CLUST-MP-RJ-52",
    beneficiaryName: "Anil Pratap Singh",
    primaryCenter: "Gwalior Inclusive Care Center",
    primaryState: "Madhya Pradesh",
    conflictingCenter: "Kota Vocational Rehabilitation Hub",
    conflictingState: "Rajasthan",
    faceSimilarityScore: 0.948,
    aadhaarHashCollision: false,
    claimedMonthlyStipend: 3800,
    lastSimultaneousCheckIn: "2 days ago",
    riskSeverity: "HIGH",
    status: "UNDER_REVIEW",
    detectedAt: "2026-08-31T11:20:00Z",
  },
  {
    id: "BIO-COL-104",
    clusterId: "CLUST-MH-KA-90",
    beneficiaryName: "Mohammed Imran Khan",
    primaryCenter: "Pune Blind Welfare Mission",
    primaryState: "Maharashtra",
    conflictingCenter: "Belagavi Inclusive Training Wing",
    conflictingState: "Karnataka",
    faceSimilarityScore: 0.973,
    aadhaarHashCollision: true,
    claimedMonthlyStipend: 6000,
    lastSimultaneousCheckIn: "Today, 11:42 AM",
    riskSeverity: "CRITICAL",
    status: "ACTIVE_FLAG",
    detectedAt: "2026-09-02T11:45:00Z",
  },
];

export const DEMO_GRANT_ANOMALIES: GrantDisbursementAnomaly[] = [
  {
    projectId: "p1",
    projectName: "Asha Rehabilitation Centre",
    schemeName: "Deendayal Disabled Rehabilitation Scheme (DDRS)",
    allocatedBudget: 120.0,
    disbursedAmount: 95.0,
    verifiedPhysicalProgress: 48,
    claimedProgress: 88,
    financialDivergenceLakhs: 37.4,
    riskStatus: "HIGH_EXPOSURE",
  },
  {
    projectId: "p2",
    projectName: "Pragati Skill Training Institute",
    schemeName: "PM-DAKSH Skill Development",
    allocatedBudget: 85.0,
    disbursedAmount: 68.0,
    verifiedPhysicalProgress: 56,
    claimedProgress: 80,
    financialDivergenceLakhs: 18.2,
    riskStatus: "HIGH_EXPOSURE",
  },
  {
    projectId: "p3",
    projectName: "Umang Welfare Special School",
    schemeName: "Assistance to Disabled Persons (ADIP)",
    allocatedBudget: 60.0,
    disbursedAmount: 42.0,
    verifiedPhysicalProgress: 72,
    claimedProgress: 75,
    financialDivergenceLakhs: 2.1,
    riskStatus: "COMPLIANT",
  },
];
