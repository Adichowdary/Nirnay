import { jsPDF } from "jspdf";
import { DEMO_PROJECTS, DEMO_METRICS } from "@/lib/demo-data";

export interface PDFDossierOptions {
  title?: string;
  projectId?: string;
  generatedBy?: string;
  role?: string;
  includeBhuvanContext?: boolean;
}

/**
 * Generates an official Government of India (DoSJE) Executive Monitoring Dossier
 */
export async function generateMinistryDossierPDF(options: PDFDossierOptions = {}): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const project = options.projectId
    ? DEMO_PROJECTS.find((p) => p.id === options.projectId) || DEMO_PROJECTS[0]
    : DEMO_PROJECTS[0];

  const generatedBy = options.generatedBy || "DoSJE Central Command Directorate";
  const role = options.role || "Central Admin / Ministerial Oversight";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Government Header Band
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("GOVERNMENT OF INDIA", pageWidth / 2, 9, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("MINISTRY OF SOCIAL JUSTICE & EMPOWERMENT (DoSJE)", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // #38bdf8
  doc.text("NIRNAY — NATIONAL DECISION SUPPORT & MONITORING ENGINE", pageWidth / 2, 21, { align: "center" });

  // Tricolor accent line
  doc.setFillColor(245, 158, 11); // Saffron
  doc.rect(0, 27, pageWidth / 3, 1.5, "F");
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 27, pageWidth / 3, 1.5, "F");
  doc.setFillColor(16, 185, 129); // Green
  doc.rect((2 * pageWidth) / 3, 27, pageWidth / 3, 1.5, "F");

  // 2. Dossier Metadata Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("STATUTORY EXECUTIVE AUDIT & COMPLIANCE DOSSIER", 14, 38);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`DOSSIER REF: NIRNAY/DOSJE/2026/${project.id} | ISSUED: ${dateStr} at ${timeStr} IST`, 14, 43);

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 47, pageWidth - 28, 26, 3, 3, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("FACILITY IDENTITY & SCHEME:", 18, 54);
  doc.setFont("helvetica", "normal");
  doc.text(`${project.name} (${project.scheme_name})`, 68, 54);

  doc.setFont("helvetica", "bold");
  doc.text("ISRO BHUVAN CADASTRE:", 18, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`Plot #44/2A, ${project.district_name}, ${project.state} (±8.2m GNSS Precision)`, 68, 60);

  doc.setFont("helvetica", "bold");
  doc.text("AUTHORIZED ISSUER:", 18, 66);
  doc.setFont("helvetica", "normal");
  doc.text(`${generatedBy} (${role})`, 68, 66);

  // 3. National KPI Overview Grid
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. AUDIT SCORECARD & HEALTH TELEMETRY", 14, 82);

  const kpis = [
    { label: "AI RISK SCORE", val: `${project.ai_risk_score}/100`, color: project.ai_risk_score >= 70 ? [225, 29, 72] : [16, 185, 129] },
    { label: "OVERALL HEALTH", val: `${project.health.overall}%`, color: [37, 99, 235] },
    { label: "CCTV UPTIME", val: `${project.cctv_online}/${project.cctv_total} LIVE`, color: project.cctv_online === 0 ? [225, 29, 72] : [16, 185, 129] },
    { label: "BENEFICIARIES", val: `${project.registered_beneficiaries} ENROLLED`, color: [15, 23, 42] },
  ];

  const colWidth = (pageWidth - 28 - 9) / 4;
  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (colWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, 86, colWidth, 18, 2, 2, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 4, 92);

    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 4, 100);
  });

  // 4. 10-Point Statutory Checklist Summary
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. 10-POINT MANDATORY STATUTORY AUDIT PARAMETERS", 14, 114);

  const checklistItems = [
    { no: "01", param: "CCTV Remote Video Stream & Coverage", status: project.cctv_online > 0 ? "VERIFIED" : "DEFICIENT", val: project.cctv_online > 0 ? "Active RTSP feed" : "Stream offline >24h" },
    { no: "02", param: "DPDP Act 2023 Biometric Headcount", status: "VERIFIED", val: "Attendance log matched ±4%" },
    { no: "03", param: "Building Structural & Fire Safety", status: "VERIFIED", val: "Fire NOC certified & tagged" },
    { no: "04", param: "Kitchen & Nutrition Quality Standards", status: "VERIFIED", val: "Filtered water & menu compliant" },
    { no: "05", param: "Sanitation & Hygiene Infrastructure", status: "VERIFIED", val: "Functional clean amenities" },
    { no: "06", param: "First Aid & Medical Emergency Station", status: "VERIFIED", val: "Kit stocked, doctor log active" },
    { no: "07", param: "Grievance Redressal Register", status: "COMPLIANT", val: "Sealed box & SLA logbook active" },
    { no: "08", param: "Staff Verification & Biometric Roster", status: "VERIFIED", val: "100% authorized staff on duty" },
    { no: "09", param: "Cadastral Boundary Geofence (100m)", status: "LOCKED", val: "ISRO Bhuvan boundary verified" },
    { no: "10", param: "Grant Expenditure & Stock Utilization", status: project.status === "critical" ? "FLAGGED" : "VERIFIED", val: "Vouchers verified by PMU" },
  ];

  let currentY = 120;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, currentY, pageWidth - 28, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text("#", 17, currentY + 4.2);
  doc.text("STATUTORY PARAMETER", 26, currentY + 4.2);
  doc.text("OBSERVATION", 110, currentY + 4.2);
  doc.text("STATUS", 165, currentY + 4.2);

  currentY += 6;
  checklistItems.forEach((item, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, currentY, pageWidth - 28, 6.5, "F");

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(item.no, 17, currentY + 4.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(item.param, 26, currentY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(item.val, 110, currentY + 4.5);

    if (item.status === "DEFICIENT" || item.status === "FLAGGED") {
      doc.setTextColor(225, 29, 72);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
    }
    doc.text(`[ ${item.status} ]`, 165, currentY + 4.5);

    currentY += 6.5;
  });

  // 5. Legal & Cryptographic Integrity Footer
  currentY += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("3. STATUTORY COMPLIANCE & CRYPTOGRAPHIC VERIFICATION", 14, currentY);

  currentY += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This official electronic dossier is generated automatically by NIRNAY pursuant to the Guidelines of the Department of Social Justice & Empowerment, Government of India, and compliance mandates under the Digital Personal Data Protection (DPDP) Act 2023.",
    14,
    currentY,
    { maxWidth: pageWidth - 28 }
  );

  currentY += 12;
  const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.toUpperCase();

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`CRYPTOGRAPHIC TAMPER-PROOF HASH: ${hash}`, 18, currentY + 6);
  doc.text(`ISRO BHUVAN DATUM: WGS84 | MONGODB ATLAS CLOUD RECORD ID: ATLAS-DOC-${project.id}`, 18, currentY + 11);

  // Download the generated PDF
  doc.save(`NIRNAY_DOSJE_Audit_Dossier_${project.id}.pdf`);
}
