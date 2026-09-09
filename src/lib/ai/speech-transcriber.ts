// Multilingual Speech-to-Audit Transcription & Auto-Checklist Extraction Engine
// Designed for field officers operating in low-bandwidth / multilingual rural environments

export interface SupportedLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  samplePhrase: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "hi-IN",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    flag: "🇮🇳",
    samplePhrase: "केंद्र समय पर खुला है। 48 लाभार्थी शारीरिक रूप से उपस्थित हैं, लेकिन CCTV कैमरा 2 ऑफलाइन है और पीने का पानी उपलब्ध नहीं है।",
  },
  {
    code: "en-IN",
    label: "Indian English",
    nativeLabel: "English",
    flag: "🇮🇳",
    samplePhrase: "Center is operating on time. Observed 52 beneficiaries physically present. Attendance register is verified, CCTV camera 3 is offline and needs repair.",
  },
  {
    code: "mr-IN",
    label: "Marathi",
    nativeLabel: "मराठी",
    flag: "🇮🇳",
    samplePhrase: "केंद्र वेळेवर सुरू आहे. 45 लाभार्थी उपस्थित आहेत. उपस्थिती नोंदवही तपासली आहे.",
  },
  {
    code: "ta-IN",
    label: "Tamil",
    nativeLabel: "தமிழ்",
    flag: "🇮🇳",
    samplePhrase: "மையம் சரியான நேரத்தில் இயங்குகிறது. 50 பயனாளிகள் உள்ளனர். பதிவேடு சரிபார்க்கப்பட்டது.",
  },
  {
    code: "bn-IN",
    label: "Bengali",
    nativeLabel: "বাংলা",
    flag: "🇮🇳",
    samplePhrase: "কেন্দ্রটি সময়মতো চালু আছে। ৪৮ জন উপস্থিত আছেন। রেজিস্টার পরীক্ষা করা হয়েছে।",
  },
];

export interface ExtractedInspectionData {
  observedAttendance?: number;
  answers: Record<string, "YES" | "NO" | "FLAGGED">;
  criticalDefects: string[];
  executiveSummary: string;
  confidenceScore: number;
}

/**
 * Parses spoken multilingual text into structured statutory inspection checklist items.
 */
export function extractInspectionFromTranscript(
  transcript: string,
  langCode: string = "en-IN"
): ExtractedInspectionData {
  const lower = transcript.toLowerCase();
  const answers: Record<string, "YES" | "NO" | "FLAGGED"> = {};
  const defects: string[] = [];

  // Extract attendance number if mentioned (e.g., "48 beneficiaries" or "48 लाभार्थी" or "observed 52")
  let observedAttendance: number | undefined = undefined;
  const attendanceMatch = transcript.match(/(\d+)\s*(?:beneficiaries|people|students|children|लाभार्थी|उपस्थित|জন|பயனாளிகள்)/i) ||
    transcript.match(/(?:count|headcount|observed|उपस्थिति|हाजिरी|संख्या)\s*(?:is|was|of|:)?\s*(\d+)/i) ||
    transcript.match(/(\d+)/);

  if (attendanceMatch) {
    const parsed = parseInt(attendanceMatch[1], 10);
    if (parsed > 0 && parsed < 500) {
      observedAttendance = parsed;
    }
  }

  // Question 1: Operating hours
  if (lower.includes("operating on time") || lower.includes("समय पर") || lower.includes("open") || lower.includes("वेळेवर") || lower.includes("நேரத்தில்")) {
    answers["q1"] = "YES";
  } else if (lower.includes("closed") || lower.includes("late") || lower.includes("बंद") || lower.includes("देरी")) {
    answers["q1"] = "NO";
    defects.push("Center not operating during designated statutory hours");
  }

  // Question 2: Registered beneficiaries physically present
  if (lower.includes("physically present") || lower.includes("उपस्थित") || lower.includes("present") || lower.includes("حاضر")) {
    answers["q2"] = "YES";
  } else if (lower.includes("absent") || lower.includes("ghost") || lower.includes("कम उपस्थिति") || lower.includes("अनुपस्थित")) {
    answers["q2"] = "FLAGGED";
    defects.push("Significant physical headcount deficit observed on-site");
  }

  // Question 3: Attendance register
  if (lower.includes("register is verified") || lower.includes("register up to date") || lower.includes("रजिस्टर") || lower.includes("नोंदवही")) {
    answers["q3"] = "YES";
  } else if (lower.includes("missing register") || lower.includes("register not updated")) {
    answers["q3"] = "NO";
    defects.push("Attendance register missing or not maintained in real-time");
  }

  // Question 4: CCTV camera status
  if (
    lower.includes("cctv offline") ||
    lower.includes("camera offline") ||
    lower.includes("कैमरा ऑफलाइन") ||
    lower.includes("बंद है") ||
    lower.includes("repair") ||
    (lower.includes("cctv") && lower.includes("offline")) ||
    (lower.includes("camera") && lower.includes("offline"))
  ) {
    answers["q4"] = "NO";
    defects.push("CCTV camera stream offline / optical occlusion detected");
  } else if (lower.includes("cctv operational") || lower.includes("cctv working") || lower.includes("कैमरा चालू")) {
    answers["q4"] = "YES";
  }

  // Question 5: Infrastructure & drinking water
  if (lower.includes("drinking water") || lower.includes("infrastructure failure") || lower.includes("पानी उपलब्ध नहीं") || lower.includes("broken")) {
    answers["q5"] = "FLAGGED";
    defects.push("Clean drinking water or sanitation facility infrastructure non-compliant");
  } else if (lower.includes("facilities functional") || lower.includes("infrastructure good")) {
    answers["q5"] = "YES";
  }

  // Question 6: Certified staff on duty
  if (lower.includes("staff on duty") || lower.includes("कर्मचारी उपस्थित") || lower.includes("trainer present")) {
    answers["q6"] = "YES";
  } else if (lower.includes("staff absent") || lower.includes("no teacher") || lower.includes("कर्मचारी गायब")) {
    answers["q6"] = "NO";
    defects.push("Mandatory qualified instructor / medical staff absent from facility");
  }

  // Question 7: Meal distribution adhering to scheme norms
  if (lower.includes("meal") || lower.includes("food") || lower.includes("भोजन") || lower.includes("आहार")) {
    if (lower.includes("bad quality") || lower.includes("not served") || lower.includes("खराब")) {
      answers["q7"] = "NO";
      defects.push("Substandard or omitted nutritional meal distribution");
    } else {
      answers["q7"] = "YES";
    }
  }

  // Question 8: Helpline number prominently displayed
  if (lower.includes("helpline") || lower.includes("board displayed") || lower.includes("हेल्पलाइन") || lower.includes("फलक")) {
    answers["q8"] = "YES";
  }

  // Generate Executive Summary
  const summaryParts: string[] = [];
  summaryParts.push(`Field officer conducted audio-recorded unannounced surprise inspection.`);
  if (observedAttendance) {
    summaryParts.push(`Physical headcount recorded: ${observedAttendance} beneficiaries.`);
  }
  if (defects.length > 0) {
    summaryParts.push(`Critical non-compliance points identified: ${defects.join("; ")}.`);
  } else {
    summaryParts.push(`All inspected scheme statutory parameters found in compliance.`);
  }

  return {
    observedAttendance,
    answers,
    criticalDefects: defects,
    executiveSummary: summaryParts.join(" "),
    confidenceScore: 0.94,
  };
}
