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
  hubspot_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_popia_assessments_created_at ON popia_assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_popia_assessments_email ON popia_assessments (email);
