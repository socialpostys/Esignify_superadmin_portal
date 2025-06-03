import { createServerSupabaseClient } from "./supabase-client"

interface TableInfo {
  name: string
  exists: boolean
  columns?: string[]
  error?: string
}

interface DatabaseHealth {
  connected: boolean
  tablesStatus: TableInfo[]
  missingTables: string[]
  errors: string[]
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const requiredTables = [
    "organizations",
    "users",
    "signature_templates",
    "azure_settings",
    "transport_rules",
    "deployment_logs",
    "user_sessions",
  ]

  const health: DatabaseHealth = {
    connected: false,
    tablesStatus: [],
    missingTables: [],
    errors: [],
  }

  try {
    const supabase = createServerSupabaseClient()

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1)

    if (connectionError) {
      health.errors.push(`Connection failed: ${connectionError.message}`)
      return health
    }

    health.connected = true

    // Check each required table
    for (const tableName of requiredTables) {
      try {
        // Check if table exists and get column info
        const { data: tableInfo, error: tableError } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type")
          .eq("table_name", tableName)
          .eq("table_schema", "public")

        if (tableError) {
          health.tablesStatus.push({
            name: tableName,
            exists: false,
            error: tableError.message,
          })
          health.missingTables.push(tableName)
          continue
        }

        if (!tableInfo || tableInfo.length === 0) {
          health.tablesStatus.push({
            name: tableName,
            exists: false,
            error: "Table not found",
          })
          health.missingTables.push(tableName)
        } else {
          health.tablesStatus.push({
            name: tableName,
            exists: true,
            columns: tableInfo.map((col) => `${col.column_name} (${col.data_type})`),
          })
        }
      } catch (error) {
        health.tablesStatus.push({
          name: tableName,
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        health.missingTables.push(tableName)
      }
    }
  } catch (error) {
    health.errors.push(error instanceof Error ? error.message : "Unknown database error")
  }

  return health
}

export async function createMissingTables(): Promise<{ success: boolean; errors: string[] }> {
  const supabase = createServerSupabaseClient()
  const errors: string[] = []

  const tableCreationSQL = {
    organizations: `
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
    `,
    users: `
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
    `,
    signature_templates: `
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
    `,
    azure_settings: `
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
    `,
    transport_rules: `
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
    `,
    deployment_logs: `
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
    `,
    user_sessions: `
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
    `,
  }

  // Create tables one by one
  for (const [tableName, sql] of Object.entries(tableCreationSQL)) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql })
      if (error) {
        errors.push(`Failed to create ${tableName}: ${error.message}`)
      }
    } catch (error) {
      errors.push(`Failed to create ${tableName}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return {
    success: errors.length === 0,
    errors,
  }
}
