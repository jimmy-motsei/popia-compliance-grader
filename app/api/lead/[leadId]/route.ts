import { NextResponse } from "next/server";
import { getLead } from "@/lib/leads/store";

interface Params {
  params: { leadId: string };
}

export async function GET(_: Request, { params }: Params) {
  const lead = await getLead(params.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
