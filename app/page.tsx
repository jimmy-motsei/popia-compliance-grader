"use client";

import { useMemo, useState } from "react";
import type { AssessmentResult, ScanResult } from "@/types/assessment";
import type { LeadSubmissionPayload, LeadSubmissionResponse } from "@/types/lead";

interface ScanApiResponse {
  scan: ScanResult;
  assessment: AssessmentResult;
}

const PILLAR_LABELS: Record<string, string> = {
  transparency_notice: "Transparency & Notice",
  consent_lawful_basis: "Consent & Lawful Basis",
  data_minimization: "Data Minimization",
  security_integrity: "Security & Integrity",
  data_subject_rights: "Data Subject Rights"
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanApiResponse | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const validLeadInput = useMemo(() => {
    return Boolean(name.trim() && companyName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [name, companyName, email]);

  async function runScan() {
    setError(null);
    setLoading(true);
    setResult(null);
    setLeadMessage(null);
    setLeadError(null);
    setReportUrl(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = (await response.json()) as ScanApiResponse | { error: string };
      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Scan failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Unexpected error while scanning website.");
    } finally {
      setLoading(false);
    }
  }

  async function submitLead() {
    if (!result || !validLeadInput) return;

    setLeadLoading(true);
    setLeadMessage(null);
    setLeadError(null);

    const payload: LeadSubmissionPayload = {
      name: name.trim(),
      email: email.trim(),
      companyName: companyName.trim(),
      websiteUrl: result.scan.targetUrl,
      scan: result.scan,
      assessment: result.assessment
    };

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as LeadSubmissionResponse | { error: string };

      if (!response.ok || "error" in data) {
        setLeadError("error" in data ? data.error : "Lead submission failed");
        return;
      }

      if (data.hubspotStatus === "synced") {
        setLeadMessage(
          `Lead captured in ${data.storageBackend.toUpperCase()} and synced to HubSpot (contact id: ${
            data.hubspotContactId ?? "n/a"
          }).`
        );
      } else if (data.hubspotStatus === "not_configured") {
        setLeadMessage(`Lead captured in ${data.storageBackend.toUpperCase()}. HubSpot sync is not configured yet.`);
      } else {
        setLeadMessage(
          `Lead captured in ${data.storageBackend.toUpperCase()}, but HubSpot sync failed. See server logs/error payload.`
        );
      }
      setReportUrl(data.reportUrl);

      if (data.emailStatus === "sent") {
        setLeadMessage((prev) => `${prev ?? "Lead captured."} Report email sent successfully.`);
      } else if (data.emailStatus === "not_configured") {
        setLeadMessage((prev) => `${prev ?? "Lead captured."} Email delivery is not configured yet.`);
      } else {
        setLeadMessage((prev) => `${prev ?? "Lead captured."} Email delivery failed.`);
        if (data.emailError) {
          setLeadError(`Email error: ${data.emailError}`);
        }
      }
    } catch {
      setLeadError("Unexpected error while submitting lead.");
    } finally {
      setLeadLoading(false);
    }
  }

  return (
    <main className="container" style={{ padding: "3rem 0" }}>
      <section className="grid grid-2" style={{ alignItems: "start" }}>
        <div>
          <p style={{ color: "var(--maru-accent)", fontWeight: 700, letterSpacing: "0.04em" }}>MARU TOOLSUITE</p>
          <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.06, marginTop: "0.4rem", marginBottom: "0.9rem" }}>
            POPIA Compliance Grader
          </h1>
          <p className="muted" style={{ fontSize: "1.05rem", maxWidth: 640 }}>
            Scan any website, score POPIA alignment, and generate a prioritized remediation plan in under two minutes.
          </p>
          <ul className="muted" style={{ marginTop: "1.2rem", paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li>Automated scan-first assessment (no questionnaire required)</li>
            <li>Evidence-backed findings per POPIA pillar</li>
            <li>Refreshed Maru styling for consistency across tools</li>
          </ul>
        </div>

        <div className="card" style={{ padding: "1.2rem" }}>
          <label htmlFor="site-url" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>
            Website URL
          </label>
          <input
            id="site-url"
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.9rem" }}
            onClick={runScan}
            disabled={loading || !url.trim()}
          >
            {loading ? "Scanning website..." : "Run POPIA Scan"}
          </button>
          {error ? <p style={{ color: "var(--maru-danger)", marginTop: "0.8rem" }}>{error}</p> : null}
          <p className="muted" style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>
            Scan cap: 25 pages, depth 2.
          </p>
        </div>
      </section>

      {result ? (
        <section className="card" style={{ marginTop: "1.2rem", padding: "1.2rem" }}>
          <h2 style={{ marginTop: 0 }}>
            Result: {result.assessment.overallScore}/100 ({result.assessment.grade})
          </h2>
          <p className="muted" style={{ marginTop: "0.4rem" }}>
            Risk: {result.assessment.riskLevel} | Pages scanned: {result.scan.pagesScanned}/{result.scan.pagesCap}
          </p>

          <div className="grid" style={{ marginTop: "1rem" }}>
            {result.assessment.pillarScores.map((pillar) => (
              <div key={pillar.pillar} className="card" style={{ padding: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <strong>{PILLAR_LABELS[pillar.pillar] ?? pillar.pillar}</strong>
                  <span>
                    {pillar.score}/{pillar.maxScore}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: "1.3rem" }}>Top Findings</h3>
          <ul style={{ paddingLeft: "1.2rem", lineHeight: 1.6 }}>
            {result.assessment.topFindings.map((finding) => (
              <li key={finding.ruleId + finding.url}>
                <strong>{finding.title}</strong> ({finding.url})
              </li>
            ))}
          </ul>

          <h3 style={{ marginTop: "1.2rem" }}>Priority Actions</h3>
          <ol style={{ paddingLeft: "1.2rem", lineHeight: 1.6 }}>
            {result.assessment.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>

          <h3 style={{ marginTop: "1.2rem" }}>Get Full Report</h3>
          <p className="muted" style={{ marginTop: "0.3rem" }}>
            Capture this assessment as a lead and sync to HubSpot when configured.
          </p>

          <div className="grid" style={{ marginTop: "0.8rem" }}>
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <button className="btn btn-primary" disabled={leadLoading || !validLeadInput} onClick={submitLead}>
              {leadLoading ? "Submitting lead..." : "Save Lead"}
            </button>
            {leadMessage ? <p style={{ color: "#8de7ff", margin: 0 }}>{leadMessage}</p> : null}
            {leadError ? <p style={{ color: "var(--maru-danger)", margin: 0 }}>{leadError}</p> : null}
            {reportUrl ? (
              <p className="muted" style={{ margin: 0 }}>
                Report link: <a href={reportUrl} target="_blank" rel="noreferrer">{reportUrl}</a>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
