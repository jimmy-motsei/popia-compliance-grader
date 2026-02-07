import type { CrawlPage, DetectorEvidence, DetectorResult } from "@/types/assessment";
import { snippetAround, stripHtml } from "@/lib/scanner/utils";

function ensurePages(pages: CrawlPage[]): CrawlPage[] {
  return pages.length > 0 ? pages : [];
}

function findPagesByPath(pages: CrawlPage[], pathHints: string[]): CrawlPage[] {
  return pages.filter((page) => {
    const path = new URL(page.url).pathname.toLowerCase();
    return pathHints.some((hint) => path.includes(hint));
  });
}

function summarizeFormFields(html: string): string[] {
  const names = new Set<string>();
  const regex = /<(input|select|textarea)[^>]*\b(name|id)=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    names.add(match[3].toLowerCase());
  }
  return Array.from(names);
}

export function runDetectors(pages: CrawlPage[]): DetectorResult {
  const evidences: DetectorEvidence[] = [];
  const safePages = ensurePages(pages);

  const allText = safePages.map((p) => stripHtml(p.html).toLowerCase()).join(" ");

  const privacyPages = findPagesByPath(safePages, ["privacy", "policy"]);
  const hasPrivacyPage = privacyPages.length > 0;
  evidences.push({
    ruleId: "T1_PRIVACY_PAGE_PRESENT",
    pillar: "transparency_notice",
    title: "Privacy notice is publicly available",
    severity: hasPrivacyPage ? "info" : "high",
    passed: hasPrivacyPage,
    score: hasPrivacyPage ? 10 : 0,
    maxScore: 10,
    url: hasPrivacyPage ? privacyPages[0].url : safePages[0]?.url ?? "",
    snippet: hasPrivacyPage
      ? "Privacy-related page detected."
      : "No obvious privacy/policy page detected in crawl scope."
  });

  const transparencyKeywords = ["purpose", "collect", "process", "retention", "contact", "information officer"];
  const transparencyHits = transparencyKeywords.filter((k) => allText.includes(k)).length;
  evidences.push({
    ruleId: "T2_TRANSPARENCY_LANGUAGE",
    pillar: "transparency_notice",
    title: "Transparency language covers processing details",
    severity: transparencyHits >= 3 ? "info" : "medium",
    passed: transparencyHits >= 3,
    score: Math.min(10, transparencyHits * 3),
    maxScore: 10,
    url: privacyPages[0]?.url ?? safePages[0]?.url ?? "",
    snippet: snippetAround(stripHtml(privacyPages[0]?.html ?? safePages[0]?.html ?? ""), transparencyKeywords)
  });

  const consentKeywords = ["consent", "agree", "opt in", "subscribe", "marketing permission"];
  const hasConsentSignals = consentKeywords.some((k) => allText.includes(k));
  evidences.push({
    ruleId: "C1_FORM_CONSENT_SIGNALS",
    pillar: "consent_lawful_basis",
    title: "Forms show explicit consent signals",
    severity: hasConsentSignals ? "info" : "high",
    passed: hasConsentSignals,
    score: hasConsentSignals ? 12 : 0,
    maxScore: 12,
    url: safePages[0]?.url ?? "",
    snippet: snippetAround(stripHtml(safePages.map((p) => p.html).join(" ")), consentKeywords)
  });

  const cookieKeywords = ["cookie", "preferences", "manage consent"];
  const hasCookieConsent = cookieKeywords.some((k) => allText.includes(k));
  evidences.push({
    ruleId: "C2_COOKIE_CONSENT",
    pillar: "consent_lawful_basis",
    title: "Cookie consent / preference control detected",
    severity: hasCookieConsent ? "info" : "medium",
    passed: hasCookieConsent,
    score: hasCookieConsent ? 8 : 2,
    maxScore: 8,
    url: safePages[0]?.url ?? "",
    snippet: snippetAround(stripHtml(safePages[0]?.html ?? ""), cookieKeywords)
  });

  const formFields = safePages.flatMap((p) => summarizeFormFields(p.html));
  const unnecessaryFields = ["id_number", "passport", "date_of_birth", "dob", "gender"];
  const hasPotentialOverCollection = formFields.some((f) => unnecessaryFields.some((u) => f.includes(u)));
  evidences.push({
    ruleId: "D1_DATA_MINIMIZATION_FORM_FIELDS",
    pillar: "data_minimization",
    title: "Form field collection appears proportionate",
    severity: hasPotentialOverCollection ? "high" : "info",
    passed: !hasPotentialOverCollection,
    score: hasPotentialOverCollection ? 4 : 12,
    maxScore: 12,
    url: safePages[0]?.url ?? "",
    snippet: hasPotentialOverCollection
      ? `Potentially excessive fields detected: ${formFields
          .filter((f) => unnecessaryFields.some((u) => f.includes(u)))
          .slice(0, 6)
          .join(", ")}`
      : "No obvious high-risk personal data fields detected in discovered forms."
  });

  const purposeKeywords = ["purpose", "use of your information", "why we collect"];
  const purposeDeclared = purposeKeywords.some((k) => allText.includes(k));
  evidences.push({
    ruleId: "D2_PURPOSE_LIMITATION",
    pillar: "data_minimization",
    title: "Purpose limitation language is present",
    severity: purposeDeclared ? "info" : "medium",
    passed: purposeDeclared,
    score: purposeDeclared ? 8 : 2,
    maxScore: 8,
    url: privacyPages[0]?.url ?? safePages[0]?.url ?? "",
    snippet: snippetAround(stripHtml(privacyPages[0]?.html ?? ""), purposeKeywords)
  });

  const securePages = safePages.filter((p) => p.url.startsWith("https://")).length;
  const httpsRatio = safePages.length > 0 ? securePages / safePages.length : 0;
  evidences.push({
    ruleId: "S1_HTTPS_ENFORCED",
    pillar: "security_integrity",
    title: "HTTPS is consistently used",
    severity: httpsRatio === 1 ? "info" : "high",
    passed: httpsRatio === 1,
    score: httpsRatio === 1 ? 10 : Math.round(httpsRatio * 10),
    maxScore: 10,
    url: safePages[0]?.url ?? "",
    snippet: `HTTPS pages: ${securePages}/${safePages.length}`
  });

  const hasSecurityHeaders = safePages.some((p) => {
    const headers = p.headers;
    return Boolean(headers["strict-transport-security"] || headers["content-security-policy"]);
  });
  evidences.push({
    ruleId: "S2_SECURITY_HEADERS",
    pillar: "security_integrity",
    title: "Security headers detected",
    severity: hasSecurityHeaders ? "info" : "medium",
    passed: hasSecurityHeaders,
    score: hasSecurityHeaders ? 10 : 3,
    maxScore: 10,
    url: safePages[0]?.url ?? "",
    snippet: hasSecurityHeaders
      ? "At least one scanned page returned HSTS/CSP headers."
      : "No HSTS/CSP headers detected in scanned pages."
  });

  const rightsKeywords = ["access", "correct", "delete", "object", "complaint", "withdraw consent"];
  const rightsHits = rightsKeywords.filter((k) => allText.includes(k)).length;
  evidences.push({
    ruleId: "R1_DATA_SUBJECT_RIGHTS",
    pillar: "data_subject_rights",
    title: "Data subject rights language is discoverable",
    severity: rightsHits >= 3 ? "info" : "high",
    passed: rightsHits >= 3,
    score: Math.min(12, rightsHits * 3),
    maxScore: 12,
    url: privacyPages[0]?.url ?? safePages[0]?.url ?? "",
    snippet: snippetAround(stripHtml(privacyPages[0]?.html ?? safePages[0]?.html ?? ""), rightsKeywords)
  });

  const governanceKeywords = ["information officer", "paia", "regulator", "contact us"];
  const governanceHits = governanceKeywords.filter((k) => allText.includes(k)).length;
  evidences.push({
    ruleId: "R2_GOVERNANCE_CONTACT",
    pillar: "data_subject_rights",
    title: "Governance/contact pathway exists",
    severity: governanceHits >= 2 ? "info" : "medium",
    passed: governanceHits >= 2,
    score: Math.min(8, governanceHits * 3),
    maxScore: 8,
    url: safePages[0]?.url ?? "",
    snippet: snippetAround(stripHtml(safePages[0]?.html ?? ""), governanceKeywords)
  });

  return { evidences };
}
