import { NextResponse } from "next/server";

export function requireInternalApiAuth(req: Request): NextResponse | null {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) {
    return null;
  }

  const headerToken = req.headers.get("x-internal-token");
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const provided = headerToken || bearerToken;

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
