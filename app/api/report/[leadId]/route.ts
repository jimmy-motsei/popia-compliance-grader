import { NextResponse } from "next/server";
import { getLead } from "@/lib/leads/store";
import { verifySignedReportToken } from "@/lib/security/report-token";

interface Params {
  params: { leadId: string };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPillarLabel(pillar: string): string {
  return pillar
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function GET(req: Request, { params }: Params) {
  const token = new URL(req.url).searchParams.get("token");
  if (!verifySignedReportToken(params.leadId, token)) {
    return NextResponse.json({ error: "Unauthorized report access" }, { status: 401 });
  }

  const lead = await getLead(params.leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const findings = lead.assessment.topFindings
    .map(
      (f) =>
        `<li><strong>${escapeHtml(f.title)}</strong> <span style="color:#a24d4d;">(${escapeHtml(
          f.severity
        )})</span><br/><small>${escapeHtml(f.url)}</small><br/>${escapeHtml(f.snippet.slice(0, 320))}</li>`
    )
    .join("");

  const actions = lead.assessment.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  const pillars = lead.assessment.pillarScores
    .map(
      (p) =>
        `<tr><td style="padding:8px 10px;border-bottom:1px solid #dde8f2;">${escapeHtml(
          formatPillarLabel(p.pillar)
        )}</td><td style="padding:8px 10px;border-bottom:1px solid #dde8f2;text-align:right;">${p.score}/${
          p.maxScore
        }</td></tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>POPIA Report - ${escapeHtml(lead.companyName)}</title>
  <style>
    body { font-family: -apple-system, Segoe UI, sans-serif; margin: 24px; color: #132233; }
    .header { padding: 16px; border-radius: 12px; background: #eef9ff; border: 1px solid #ccefff; }
    .muted { color: #57718d; }
    .score { font-size: 36px; font-weight: 800; margin: 8px 0; }
    h2 { margin-top: 28px; }
    li { margin-bottom: 10px; }
    table { border-collapse: collapse; width: 100%; max-width: 520px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>POPIA Compliance Report</h1>
    <p class="muted">${escapeHtml(lead.companyName)} | ${escapeHtml(lead.websiteUrl)}</p>
    <p class="score">${lead.assessment.overallScore}/100 (${lead.assessment.grade})</p>
    <p><strong>Risk:</strong> ${escapeHtml(lead.assessment.riskLevel)}</p>
    <p><strong>Generated:</strong> ${escapeHtml(new Date(lead.createdAt).toLocaleString())}</p>
  </div>

  <h2>Pillar Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #dde8f2;">Pillar</th>
        <th style="text-align:right;padding:8px 10px;border-bottom:2px solid #dde8f2;">Score</th>
      </tr>
    </thead>
    <tbody>${pillars}</tbody>
  </table>

  <h2>Top Findings</h2>
  <ol>${findings || "<li>No critical findings in current scan scope.</li>"}</ol>

  <h2>Priority Actions</h2>
  <ol>${actions}</ol>

  <h2>Disclaimer</h2>
  <p class="muted">This assessment is informational and not legal advice. Validate recommendations with qualified legal counsel.</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8"
    }
  });
}
