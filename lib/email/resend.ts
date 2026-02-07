import type { AssessmentResult } from "@/types/assessment";
import { buildReportEmailHtml } from "@/lib/email/report-email";

export interface EmailSendResult {
  status: "not_configured" | "sent" | "failed";
  emailId?: string;
  error?: string;
}

interface SendInput {
  to: string;
  name: string;
  companyName: string;
  websiteUrl: string;
  assessment: AssessmentResult;
  reportUrl: string;
}

export async function sendReportEmail(input: SendInput): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    return { status: "not_configured" };
  }

  try {
    const subject = `Your POPIA Compliance Score: ${input.assessment.overallScore}/100`;
    const html = buildReportEmailHtml({
      name: input.name,
      companyName: input.companyName,
      websiteUrl: input.websiteUrl,
      assessment: input.assessment,
      reportUrl: input.reportUrl
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        html,
        reply_to: replyTo || undefined
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        status: "failed",
        error: `Resend API error (${response.status}): ${details.slice(0, 220)}`
      };
    }

    const json = (await response.json()) as { id?: string };
    return {
      status: "sent",
      emailId: json.id
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown Resend error"
    };
  }
}
