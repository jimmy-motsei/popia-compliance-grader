ALTER TABLE popia_assessments ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'not_configured';
ALTER TABLE popia_assessments ADD COLUMN IF NOT EXISTS email_id TEXT;
ALTER TABLE popia_assessments ADD COLUMN IF NOT EXISTS email_error TEXT;
