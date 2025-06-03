import { createClient } from "@supabase/supabase-js"

// Test Supabase connection
async function testSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase environment variables not set")
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection by trying to fetch from organizations table
    const { data, error } = await supabase.from("organizations").select("count").limit(1)

    if (error) {
      console.error("❌ Supabase connection failed:", error.message)
      return false
    }

    console.log("✅ Supabase connection successful")
    return true
  } catch (error) {
    console.error("❌ Supabase test failed:", error)
    return false
  }
}

// Test Azure AD configuration
async function testAzureAD() {
  const clientId = process.env.AZURE_AD_CLIENT_ID
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
  const tenantId = process.env.AZURE_AD_TENANT_ID

  if (!clientId || !clientSecret || !tenantId) {
    console.error("❌ Azure AD environment variables not set")
    return false
  }

  try {
    // Test getting an access token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("❌ Azure AD authentication failed:", error)
      return false
    }

    const tokenData = await response.json()

    if (!tokenData.access_token) {
      console.error("❌ No access token received from Azure AD")
      return false
    }

    console.log("✅ Azure AD authentication successful")
    return true
  } catch (error) {
    console.error("❌ Azure AD test failed:", error)
    return false
  }
}

// Run all tests
async function runTests() {
  console.log("🧪 Testing Email Signature Platform Setup...\n")

  const supabaseOk = await testSupabase()
  const azureOk = await testAzureAD()

  console.log("\n📊 Test Results:")
  console.log(`Supabase: ${supabaseOk ? "✅ Working" : "❌ Failed"}`)
  console.log(`Azure AD: ${azureOk ? "✅ Working" : "❌ Failed"}`)

  if (supabaseOk && azureOk) {
    console.log("\n🎉 All tests passed! Your setup is ready for production.")
  } else {
    console.log("\n⚠️  Some tests failed. Please check your configuration.")
  }
}

// Run the tests
runTests().catch(console.error)
