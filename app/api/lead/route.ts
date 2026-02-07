import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isNeonConfigured } from "@/lib/db/neon";
import type { AssessmentResult, ScanResult } from "@/types/assessment";
import { syncLeadToHubSpot } from "@/lib/integrations/hubspot";
import { insertLead } from "@/lib/leads/store";

interface LeadRequest {
  name?: string;
  email?: string;
  companyName?: string;
  websiteUrl?: string;
  scan?: ScanResult;
  assessment?: AssessmentResult;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadRequest;

    if (!body.name || !body.email || !body.companyName || !body.websiteUrl || !body.scan || !body.assessment) {
      return NextResponse.json({ error: "Missing required lead submission fields" }, { status: 400 });
    }

    if (!isValidEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const hubspot = await syncLeadToHubSpot({
      name: body.name,
      email: body.email,
      companyName: body.companyName,
      websiteUrl: body.websiteUrl,
      assessment: body.assessment
    });

    const lead = await insertLead({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      name: body.name,
      email: body.email,
      companyName: body.companyName,
      websiteUrl: body.websiteUrl,
      scan: body.scan,
      assessment: body.assessment,
      hubspotStatus: hubspot.status,
      hubspotContactId: hubspot.contactId,
      hubspotError: hubspot.error
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      reportUrl: `/api/report/${lead.id}`,
      storageBackend: isNeonConfigured() ? "neon" : "file",
      hubspotStatus: lead.hubspotStatus,
      hubspotContactId: lead.hubspotContactId,
      hubspotError: lead.hubspotError
    });
  } catch {
    return NextResponse.json({ error: "Unable to submit lead" }, { status: 500 });
  }
}
