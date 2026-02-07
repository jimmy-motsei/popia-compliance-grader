export type PillarId =
  | "transparency_notice"
  | "consent_lawful_basis"
  | "data_minimization"
  | "security_integrity"
  | "data_subject_rights";

export type Severity = "info" | "low" | "medium" | "high";

export interface CrawlPage {
  url: string;
  html: string;
  status: number;
  headers: Record<string, string>;
  depth: number;
}

export interface DetectorEvidence {
  ruleId: string;
  pillar: PillarId;
  title: string;
  severity: Severity;
  passed: boolean;
  score: number;
  maxScore: number;
  url: string;
  snippet: string;
}

export interface DetectorResult {
  evidences: DetectorEvidence[];
}

export interface PillarScore {
  pillar: PillarId;
  score: number;
  maxScore: number;
}

export interface ScanResult {
  targetUrl: string;
  scannedAt: string;
  pagesScanned: number;
  pagesCap: number;
  depthCap: number;
  evidences: DetectorEvidence[];
  pageUrls: string[];
}

export interface AssessmentResult {
  overallScore: number;
  maxScore: number;
  grade: "A" | "B" | "C" | "D";
  riskLevel: "Low Risk" | "Moderate Risk" | "Elevated Risk" | "High Risk";
  pillarScores: PillarScore[];
  topFindings: DetectorEvidence[];
  recommendations: string[];
}
