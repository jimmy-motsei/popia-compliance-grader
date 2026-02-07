import { neon } from "@neondatabase/serverless";

let initialized = false;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  return neon(databaseUrl);
}

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function ensureNeonSchema(): Promise<void> {
  if (initialized) return;

  const sql = getSql();
  if (!sql) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS popia_assessments (
      id UUID PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company_name TEXT NOT NULL,
      website_url TEXT NOT NULL,
      assessment JSONB NOT NULL,
      scan JSONB NOT NULL,
      hubspot_status TEXT NOT NULL,
      hubspot_contact_id TEXT,
      hubspot_error TEXT,
      email_status TEXT NOT NULL DEFAULT 'not_configured',
      email_id TEXT,
      email_error TEXT
    );
  `;

  await sql`ALTER TABLE popia_assessments ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'not_configured';`;
  await sql`ALTER TABLE popia_assessments ADD COLUMN IF NOT EXISTS email_id TEXT;`;
  await sql`ALTER TABLE popia_assessments ADD COLUMN IF NOT EXISTS email_error TEXT;`;

  await sql`CREATE INDEX IF NOT EXISTS idx_popia_assessments_created_at ON popia_assessments (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_popia_assessments_email ON popia_assessments (email);`;

  initialized = true;
}

export function neonSql() {
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured");
  }
  return sql;
}
