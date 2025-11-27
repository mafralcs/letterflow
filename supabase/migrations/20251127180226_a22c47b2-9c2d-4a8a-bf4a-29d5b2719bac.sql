-- Add AI provider and webhook URL columns to projects table
ALTER TABLE projects
ADD COLUMN ai_provider text NOT NULL DEFAULT 'internal',
ADD COLUMN webhook_url text;

-- Add check constraint for ai_provider values
ALTER TABLE projects
ADD CONSTRAINT projects_ai_provider_check 
CHECK (ai_provider IN ('internal', 'webhook'));