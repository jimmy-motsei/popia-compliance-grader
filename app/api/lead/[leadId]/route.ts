import { NextResponse } from "next/server";
import { getLead } from "@/lib/leads/store";
import { requireInternalApiAuth } from "@/lib/security/internal-auth";

interface Params {
  params: { leadId: string };
}

export async function GET(req: Request, { params }: Params) {
  const authError = requireInternalApiAuth(req);
  if (authError) return authError;

  const lead = await getLead(params.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
