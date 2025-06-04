-- Create table for storing PowerShell scripts
CREATE TABLE IF NOT EXISTS powershell_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    script_content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending_execution',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_powershell_scripts_org_id ON powershell_scripts(organization_id);
CREATE INDEX IF NOT EXISTS idx_powershell_scripts_status ON powershell_scripts(status);
