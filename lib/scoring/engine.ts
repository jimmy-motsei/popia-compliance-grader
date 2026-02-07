import type { AssessmentResult, DetectorEvidence, PillarId, PillarScore, ScanResult } from "@/types/assessment";

const PILLARS: PillarId[] = [
  "transparency_notice",
  "consent_lawful_basis",
  "data_minimization",
  "security_integrity",
  "data_subject_rights"
];

function scoreBand(score: number): AssessmentResult["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

function riskBand(score: number): AssessmentResult["riskLevel"] {
  if (score >= 85) return "Low Risk";
  if (score >= 70) return "Moderate Risk";
  if (score >= 50) return "Elevated Risk";
  return "High Risk";
}

function topFindings(evidences: DetectorEvidence[]): DetectorEvidence[] {
  return evidences
    .filter((e) => !e.passed)
    .sort((a, b) => b.maxScore - a.maxScore)
    .slice(0, 5);
}

function recommendations(failures: DetectorEvidence[]): string[] {
  const map: Record<string, string> = {
    T1_PRIVACY_PAGE_PRESENT: "Publish a clear privacy notice linked from the header/footer on all pages.",
    T2_TRANSPARENCY_LANGUAGE: "Expand privacy disclosures for purpose, retention, contact channel, and processing scope.",
    C1_FORM_CONSENT_SIGNALS: "Add explicit opt-in consent controls for marketing and clearly separated legal text.",
    C2_COOKIE_CONSENT: "Implement cookie preference controls with non-essential cookies disabled by default.",
    D1_DATA_MINIMIZATION_FORM_FIELDS: "Remove unnecessary high-risk personal fields from lead forms unless strictly required.",
    D2_PURPOSE_LIMITATION: "State the exact purpose for each personal data collection point near the form.",
    S1_HTTPS_ENFORCED: "Enforce HTTPS for every route and redirect all HTTP traffic permanently.",
    S2_SECURITY_HEADERS: "Configure HSTS and CSP headers at the web server/CDN layer.",
    R1_DATA_SUBJECT_RIGHTS: "Add a rights section explaining access, correction, deletion, objection, and complaints.",
    R2_GOVERNANCE_CONTACT: "Publish Information Officer/contact details and a data request channel."
  };

  const unique = new Set<string>();
  for (const finding of failures) {
    const recommendation = map[finding.ruleId];
    if (recommendation) unique.add(recommendation);
  }

  if (unique.size === 0) {
    unique.add("Maintain controls with quarterly compliance scans and update legal pages when data practices change.");
  }

  return Array.from(unique).slice(0, 5);
}

export function assess(scan: ScanResult): AssessmentResult {
  const pillarScores: PillarScore[] = PILLARS.map((pillar) => {
    const scoped = scan.evidences.filter((e) => e.pillar === pillar);
    const score = scoped.reduce((acc, item) => acc + item.score, 0);
    const maxScore = scoped.reduce((acc, item) => acc + item.maxScore, 0) || 20;

    return {
      pillar,
      score: Math.round((score / maxScore) * 20),
      maxScore: 20
    };
  });

  const overallScore = pillarScores.reduce((acc, p) => acc + p.score, 0);
  const findings = topFindings(scan.evidences);

  return {
    overallScore,
    maxScore: 100,
    grade: scoreBand(overallScore),
    riskLevel: riskBand(overallScore),
    pillarScores,
    topFindings: findings,
    recommendations: recommendations(findings)
  };
}
