import type { AssessmentResult, ScanResult } from "@/types/assessment";

export interface LeadSubmissionPayload {
  name: string;
  email: string;
  companyName: string;
  websiteUrl: string;
  scan: ScanResult;
  assessment: AssessmentResult;
}

export interface LeadSubmissionResponse {
  success: boolean;
  leadId: string;
  reportUrl: string;
  storageBackend: "neon" | "file";
  hubspotStatus: "not_configured" | "synced" | "failed";
  hubspotContactId?: string;
  hubspotError?: string;
}
