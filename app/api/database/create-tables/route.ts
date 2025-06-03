import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // SQL to create all tables
    const createTablesSQL = `
      -- Create organizations table
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        admin_email VARCHAR(255),
        admin_password_hash VARCHAR(255),
        users_count INTEGER DEFAULT 0,
        templates_count INTEGER DEFAULT 0,
        azure_status VARCHAR(50) DEFAULT 'Not Connected',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        title VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        has_signature BOOLEAN DEFAULT false,
        signature_template_id UUID,
        azure_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, email)
      );

      -- Create signature_templates table
      CREATE TABLE IF NOT EXISTS signature_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        html_content TEXT NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create azure_settings table
      CREATE TABLE IF NOT EXISTS azure_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        tenant_id VARCHAR(255) NOT NULL,
        client_id VARCHAR(255) NOT NULL,
        client_secret VARCHAR(255) NOT NULL,
        is_connected BOOLEAN DEFAULT false,
        sync_frequency VARCHAR(50) DEFAULT 'manual',
        sync_disabled_users BOOLEAN DEFAULT false,
        auto_provision BOOLEAN DEFAULT false,
        sync_groups BOOLEAN DEFAULT false,
        auto_assign_signatures BOOLEAN DEFAULT false,
        server_side_deployment BOOLEAN DEFAULT false,
        last_sync TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id)
      );

      -- Create transport_rules table
      CREATE TABLE IF NOT EXISTS transport_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        exchange_rule_id VARCHAR(255),
        from_addresses TEXT[],
        from_scope VARCHAR(50) DEFAULT 'InOrganization',
        sent_to_scope VARCHAR(50) DEFAULT 'NotInOrganization',
        html_content TEXT NOT NULL,
        location VARCHAR(50) DEFAULT 'Append',
        fallback_action VARCHAR(50) DEFAULT 'Wrap',
        priority INTEGER DEFAULT 0,
        is_enabled BOOLEAN DEFAULT true,
        deployment_status VARCHAR(50) DEFAULT 'pending',
        last_deployed TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create deployment_logs table
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        transport_rule_id UUID REFERENCES transport_rules(id) ON DELETE CASCADE,
        operation VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        user_id VARCHAR(255),
        execution_time INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create user_sessions table
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        refresh_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_signature_templates_organization_id ON signature_templates(organization_id);
      CREATE INDEX IF NOT EXISTS idx_transport_rules_organization_id ON transport_rules(organization_id);
      CREATE INDEX IF NOT EXISTS idx_deployment_logs_organization_id ON deployment_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: createTablesSQL,
    })

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log("exec_sql not available, trying direct execution")

      // Split and execute each statement
      const statements = createTablesSQL.split(";").filter((stmt) => stmt.trim())

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc("exec", {
            sql: statement.trim(),
          })
          if (stmtError) {
            console.error("Error executing statement:", stmtError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully",
    })
  } catch (error) {
    console.error("Error creating tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error creating tables",
      },
      { status: 500 },
    )
  }
}
