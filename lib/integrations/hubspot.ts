import type { AssessmentResult } from "@/types/assessment";

interface HubSpotLeadInput {
  name: string;
  email: string;
  companyName: string;
  websiteUrl: string;
  assessment: AssessmentResult;
}

interface HubSpotSyncResult {
  status: "not_configured" | "synced" | "failed";
  contactId?: string;
  error?: string;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

export async function syncLeadToHubSpot(input: HubSpotLeadInput): Promise<HubSpotSyncResult> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return { status: "not_configured" };
  }

  const propScore = process.env.HUBSPOT_PROP_POPIA_SCORE ?? "popia_compliance_score";
  const propRisk = process.env.HUBSPOT_PROP_POPIA_RISK ?? "popia_risk_level";
  const propGrade = process.env.HUBSPOT_PROP_POPIA_GRADE ?? "popia_assessment_grade";
  const propDate = process.env.HUBSPOT_PROP_POPIA_DATE ?? "popia_assessment_date";

  const { firstName, lastName } = splitName(input.name);

  try {
    const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          email: input.email,
          firstname: firstName,
          lastname: lastName,
          company: input.companyName,
          website: input.websiteUrl,
          [propScore]: input.assessment.overallScore,
          [propRisk]: input.assessment.riskLevel,
          [propGrade]: input.assessment.grade,
          [propDate]: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        status: "failed",
        error: `HubSpot API error (${response.status}): ${details.slice(0, 220)}`
      };
    }

    const json = (await response.json()) as { id?: string };
    return {
      status: "synced",
      contactId: json.id
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown HubSpot sync error"
    };
  }
}
