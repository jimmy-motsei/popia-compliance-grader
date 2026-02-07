import { NextResponse } from "next/server";
import { assess } from "@/lib/scoring/engine";
import type { ScanResult } from "@/types/assessment";

interface ScoreRequest {
  scan?: ScanResult;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ScoreRequest;
    if (!body.scan) {
      return NextResponse.json({ error: "scan payload is required" }, { status: 400 });
    }

    const assessment = assess(body.scan);
    return NextResponse.json({ assessment });
  } catch {
    return NextResponse.json({ error: "Unable to score scan payload" }, { status: 500 });
  }
}
