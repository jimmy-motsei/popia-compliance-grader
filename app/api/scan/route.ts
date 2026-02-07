import { NextResponse } from "next/server";
import { assess } from "@/lib/scoring/engine";
import { scanWebsite } from "@/lib/scanner";

interface ScanRequest {
  url?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScanRequest;
    if (!body.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalized = body.url.startsWith("http") ? body.url : `https://${body.url}`;
    const scan = await scanWebsite(normalized);
    const assessment = assess(scan);

    return NextResponse.json({ scan, assessment });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete scan. Please verify URL and try again." },
      { status: 500 }
    );
  }
}
