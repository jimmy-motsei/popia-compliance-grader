import { NextResponse } from "next/server";
import { isNeonConfigured } from "@/lib/db/neon";
import { listLeads } from "@/lib/leads/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

  const leads = await listLeads(limit);
  return NextResponse.json({
    leads,
    count: leads.length,
    storageBackend: isNeonConfigured() ? "neon" : "file"
  });
}
