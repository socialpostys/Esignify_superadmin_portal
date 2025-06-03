import { createServerSupabaseClient } from "./supabase-client"

export async function initializeDatabase() {
  try {
    const supabase = createServerSupabaseClient()

    // Create tables if they don't exist
    const { error: orgError } = await supabase.rpc("initialize_database")

    if (orgError) {
      console.error("Error initializing database:", orgError)
      return { success: false, error: orgError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error initializing database:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error initializing database",
    }
  }
}

// SQL function to be created in Supabase
/*
CREATE OR REPLACE FUNCTION initialize_database()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create organizations table if it doesn't exist
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

  -- Create other tables...
  -- (Include all table creation statements from the SQL script)

  RETURN TRUE;
END;
$$;
*/
