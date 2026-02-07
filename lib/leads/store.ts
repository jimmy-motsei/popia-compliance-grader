import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { ensureNeonSchema, isNeonConfigured, neonSql } from "@/lib/db/neon";
import type { AssessmentResult, ScanResult } from "@/types/assessment";

export interface LeadRecord {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  companyName: string;
  websiteUrl: string;
  assessment: AssessmentResult;
  scan: ScanResult;
  hubspotStatus: "not_configured" | "synced" | "failed";
  hubspotContactId?: string;
  hubspotError?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

let writeChain: Promise<void> = Promise.resolve();

interface DbLeadRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company_name: string;
  website_url: string;
  assessment: AssessmentResult | string;
  scan: ScanResult | string;
  hubspot_status: "not_configured" | "synced" | "failed";
  hubspot_contact_id: string | null;
  hubspot_error: string | null;
}

async function ensureDataFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(LEADS_FILE, "utf8");
  } catch {
    await writeFile(LEADS_FILE, "[]", "utf8");
  }
}

async function readLeads(): Promise<LeadRecord[]> {
  await ensureDataFile();
  const raw = await readFile(LEADS_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as LeadRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLeads(leads: LeadRecord[]): Promise<void> {
  await ensureDataFile();
  await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
}

export async function insertLead(lead: LeadRecord): Promise<LeadRecord> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = neonSql();
    await sql`
      INSERT INTO popia_assessments (
        id, created_at, name, email, company_name, website_url, assessment, scan, hubspot_status, hubspot_contact_id, hubspot_error
      )
      VALUES (
        ${lead.id},
        ${lead.createdAt},
        ${lead.name},
        ${lead.email},
        ${lead.companyName},
        ${lead.websiteUrl},
        ${JSON.stringify(lead.assessment)},
        ${JSON.stringify(lead.scan)},
        ${lead.hubspotStatus},
        ${lead.hubspotContactId ?? null},
        ${lead.hubspotError ?? null}
      );
    `;
    return lead;
  }

  await ensureDataFile();

  writeChain = writeChain.catch(() => undefined).then(async () => {
    const leads = await readLeads();
    leads.push(lead);
    await writeLeads(leads);
  });

  await writeChain;
  return lead;
}

export async function getLead(id: string): Promise<LeadRecord | null> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = neonSql();
    const rows = await sql<DbLeadRow[]>`
      SELECT
        id, created_at, name, email, company_name, website_url, assessment, scan, hubspot_status, hubspot_contact_id, hubspot_error
      FROM popia_assessments
      WHERE id = ${id}
      LIMIT 1;
    `;

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      email: row.email,
      companyName: row.company_name,
      websiteUrl: row.website_url,
      assessment: typeof row.assessment === "string" ? (JSON.parse(row.assessment) as AssessmentResult) : row.assessment,
      scan: typeof row.scan === "string" ? (JSON.parse(row.scan) as ScanResult) : row.scan,
      hubspotStatus: row.hubspot_status,
      hubspotContactId: row.hubspot_contact_id ?? undefined,
      hubspotError: row.hubspot_error ?? undefined
    };
  }

  const leads = await readLeads();
  return leads.find((lead) => lead.id === id) ?? null;
}

export async function listLeads(limit = 50): Promise<LeadRecord[]> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = neonSql();
    const rows = await sql<DbLeadRow[]>`
      SELECT
        id, created_at, name, email, company_name, website_url, assessment, scan, hubspot_status, hubspot_contact_id, hubspot_error
      FROM popia_assessments
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      name: row.name,
      email: row.email,
      companyName: row.company_name,
      websiteUrl: row.website_url,
      assessment: typeof row.assessment === "string" ? (JSON.parse(row.assessment) as AssessmentResult) : row.assessment,
      scan: typeof row.scan === "string" ? (JSON.parse(row.scan) as ScanResult) : row.scan,
      hubspotStatus: row.hubspot_status,
      hubspotContactId: row.hubspot_contact_id ?? undefined,
      hubspotError: row.hubspot_error ?? undefined
    }));
  }

  const leads = await readLeads();
  return leads
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
