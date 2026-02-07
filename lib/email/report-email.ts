import type { AssessmentResult } from "@/types/assessment";

function esc(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReportEmailHtml(params: {
  name: string;
  companyName: string;
  websiteUrl: string;
  assessment: AssessmentResult;
  reportUrl: string;
}): string {
  const { name, companyName, websiteUrl, assessment, reportUrl } = params;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#091422;font-family:Arial,sans-serif;color:#eff7ff;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="640" cellspacing="0" cellpadding="0" style="background:#102032;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;">
            <tr><td style="color:#00d9ff;font-weight:700;letter-spacing:.04em;">MARU TOOLSUITE</td></tr>
            <tr><td style="font-size:28px;line-height:1.2;padding-top:8px;font-weight:700;">Your POPIA Compliance Report</td></tr>
            <tr><td style="padding-top:12px;color:#9bb7cf;">Hi ${esc(name)}, your scan for <strong style="color:#eff7ff;">${esc(companyName)}</strong> is ready.</td></tr>
            <tr><td style="padding-top:8px;color:#9bb7cf;">Website scanned: ${esc(websiteUrl)}</td></tr>
            <tr><td style="padding-top:16px;font-size:34px;font-weight:800;">${assessment.overallScore}/100 (${assessment.grade})</td></tr>
            <tr><td style="padding-top:8px;color:#9bb7cf;">Risk Level: <strong style="color:#eff7ff;">${esc(assessment.riskLevel)}</strong></td></tr>
            <tr>
              <td style="padding-top:20px;">
                <a href="${esc(reportUrl)}" style="display:inline-block;background:#00d9ff;color:#03222a;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">View Full Report</a>
              </td>
            </tr>
            <tr><td style="padding-top:18px;color:#9bb7cf;">This assessment is informational and not legal advice.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
