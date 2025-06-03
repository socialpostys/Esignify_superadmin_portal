import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Shield, Server, Users, Settings, Database, AlertTriangle } from "lucide-react"

export default function AdminGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administrator Guide</h1>
          <p className="mt-2 text-gray-600">Complete setup and management guide for system administrators</p>
        </div>

        {/* System Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              System Requirements & Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Microsoft 365 Requirements:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Exchange Online subscription</li>
                  <li>Azure Active Directory (any tier)</li>
                  <li>Global Administrator or Exchange Administrator permissions</li>
                  <li>PowerShell execution policy allowing remote scripts</li>
                </ul>
                <p>
                  <strong>Network Requirements:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>HTTPS access to Microsoft Graph API</li>
                  <li>HTTPS access to Exchange Online PowerShell</li>
                  <li>Outbound connections on port 443</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Initial Platform Setup</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>1. Organization Creation:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Super admin creates organization in platform</li>
                  <li>Provides organization name, domain, and admin credentials</li>
                  <li>Sets up initial branding (logo, colors)</li>
                  <li>Configures basic settings and policies</li>
                </ol>
                <p>
                  <strong>2. Admin Account Setup:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Organization admin receives login credentials</li>
                  <li>First login requires password change</li>
                  <li>Enable two-factor authentication (recommended)</li>
                  <li>Complete organization profile</li>
                </ol>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Azure AD Integration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Azure AD Integration Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Step 1: Register Application in Azure</h3>
              <div className="space-y-3 text-gray-700">
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>
                    Sign in to{" "}
                    <a
                      href="https://portal.azure.com"
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Azure Portal
                    </a>
                  </li>
                  <li>Navigate to Azure Active Directory → App registrations</li>
                  <li>Click "New registration"</li>
                  <li>Enter application name: "Signify Email Signatures"</li>
                  <li>Select "Accounts in this organizational directory only"</li>
                  <li>Leave Redirect URI blank for now</li>
                  <li>Click "Register"</li>
                </ol>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Step 2: Configure API Permissions</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Required Microsoft Graph Permissions:</strong>
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <code>User.Read.All</code> - Read all users' profiles
                    </li>
                    <li>
                      <code>Group.Read.All</code> - Read all groups
                    </li>
                    <li>
                      <code>Directory.Read.All</code> - Read directory data
                    </li>
                    <li>
                      <code>Organization.Read.All</code> - Read organization info
                    </li>
                  </ul>
                </div>
                <p>
                  <strong>Setup Steps:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to API permissions in your app registration</li>
                  <li>Click "Add a permission" → Microsoft Graph → Application permissions</li>
                  <li>Add each required permission listed above</li>
                  <li>Click "Grant admin consent" (requires Global Admin)</li>
                  <li>Verify all permissions show "Granted" status</li>
                </ol>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Step 3: Create Client Secret</h3>
              <div className="space-y-3 text-gray-700">
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to Certificates & secrets in your app registration</li>
                  <li>Click "New client secret"</li>
                  <li>Enter description: "Signify Platform Access"</li>
                  <li>Set expiration (24 months recommended)</li>
                  <li>Click "Add" and immediately copy the secret value</li>
                  <li>
                    <strong className="text-red-600">Important:</strong> Store the secret securely - it won't be shown
                    again
                  </li>
                </ol>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Step 4: Configure in Signify Platform</h3>
              <div className="space-y-3 text-gray-700">
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Log in to your organization admin dashboard</li>
                  <li>Navigate to Settings → Azure AD Integration</li>
                  <li>Enter the following information:</li>
                </ol>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <strong>Tenant ID:</strong> Found in Azure AD → Properties → Tenant ID
                    </li>
                    <li>
                      <strong>Client ID:</strong> Application (client) ID from app registration
                    </li>
                    <li>
                      <strong>Client Secret:</strong> The secret value you copied
                    </li>
                  </ul>
                </div>
                <ol className="list-decimal list-inside space-y-1 ml-4" start={4}>
                  <li>Enable the connection and test connectivity</li>
                  <li>Configure sync settings (frequency, user filters, etc.)</li>
                  <li>Perform initial user sync</li>
                </ol>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Exchange Online Setup */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Exchange Online Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">PowerShell Module Installation</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Install Required Modules:</strong>
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div># Install Exchange Online Management module</div>
                  <div>Install-Module -Name ExchangeOnlineManagement -Force</div>
                  <div>
                    <br />
                  </div>
                  <div># Install Azure AD module (if needed)</div>
                  <div>Install-Module -Name AzureAD -Force</div>
                </div>
                <p>
                  <strong>Connect to Exchange Online:</strong>
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div># Connect using modern authentication</div>
                  <div>Connect-ExchangeOnline -UserPrincipalName admin@yourdomain.com</div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Transport Rule Configuration</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Automatic Setup:</strong> The platform can automatically create transport rules for signature
                  deployment.
                </p>
                <p>
                  <strong>Manual Setup (if needed):</strong>
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div># Create transport rule for signature deployment</div>
                  <div>New-TransportRule -Name "Signify Email Signatures" `</div>
                  <div>&nbsp;&nbsp;-ApplyHtmlDisclaimerLocation Append `</div>
                  <div>&nbsp;&nbsp;-ApplyHtmlDisclaimerText $signatureHtml `</div>
                  <div>&nbsp;&nbsp;-ApplyHtmlDisclaimerFallbackAction Wrap `</div>
                  <div>&nbsp;&nbsp;-SentToScope NotInOrganization `</div>
                  <div>&nbsp;&nbsp;-FromScope InOrganization</div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Permissions Required</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Exchange Online Permissions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Exchange Administrator role (minimum)</li>
                  <li>Or Global Administrator role</li>
                  <li>Transport Rules management permissions</li>
                  <li>Organization Configuration permissions</li>
                </ul>
                <p>
                  <strong>Service Account (Recommended):</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Create dedicated service account for API access</li>
                  <li>Assign minimum required permissions</li>
                  <li>Use application-based authentication when possible</li>
                  <li>Enable audit logging for service account activities</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              User Management Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Sync Configuration</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Sync Frequency Options:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <Badge variant="secondary">Manual</Badge> - Sync only when triggered manually
                  </li>
                  <li>
                    <Badge variant="default">Hourly</Badge> - Automatic sync every hour
                  </li>
                  <li>
                    <Badge variant="default">Daily</Badge> - Sync once per day (recommended)
                  </li>
                  <li>
                    <Badge variant="default">Weekly</Badge> - Sync once per week
                  </li>
                </ul>
                <p>
                  <strong>Sync Options:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Include Disabled Users:</strong> Sync users who are disabled in Azure AD
                  </li>
                  <li>
                    <strong>Auto-Provision:</strong> Automatically create accounts for new Azure AD users
                  </li>
                  <li>
                    <strong>Sync Groups:</strong> Import group memberships for department-based signatures
                  </li>
                  <li>
                    <strong>Auto-Assign Signatures:</strong> Automatically assign default signature to new users
                  </li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">User Lifecycle Management</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>New User Process:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>User created in Azure AD</li>
                  <li>Next sync imports user to platform</li>
                  <li>Default signature automatically assigned (if enabled)</li>
                  <li>Signature deployed via transport rules</li>
                  <li>Admin notified of new user (if enabled)</li>
                </ol>
                <p>
                  <strong>User Departure Process:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>User disabled in Azure AD</li>
                  <li>Next sync marks user as inactive</li>
                  <li>Signature deployment rules updated</li>
                  <li>User data retained per retention policy</li>
                </ol>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Security & Compliance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Security Hardening</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Access Controls:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Implement principle of least privilege</li>
                  <li>Use role-based access control (RBAC)</li>
                  <li>Enable multi-factor authentication for all admins</li>
                  <li>Regular access reviews and permission audits</li>
                  <li>Immediate access revocation for departed staff</li>
                </ul>
                <p>
                  <strong>API Security:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Rotate client secrets regularly (every 12-24 months)</li>
                  <li>Monitor API usage and set up alerts for anomalies</li>
                  <li>Use certificate-based authentication where possible</li>
                  <li>Implement rate limiting and throttling</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Compliance Considerations</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Data Protection:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>GDPR compliance for EU users</li>
                  <li>CCPA compliance for California residents</li>
                  <li>Data residency requirements</li>
                  <li>Right to be forgotten implementation</li>
                  <li>Data portability and export capabilities</li>
                </ul>
                <p>
                  <strong>Audit Requirements:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Comprehensive audit logging</li>
                  <li>User activity monitoring</li>
                  <li>Change management tracking</li>
                  <li>Regular security assessments</li>
                  <li>Incident response procedures</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Backup & Disaster Recovery</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Data Backup:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Automated daily backups of all organization data</li>
                  <li>Point-in-time recovery capabilities</li>
                  <li>Cross-region backup replication</li>
                  <li>Regular backup integrity testing</li>
                </ul>
                <p>
                  <strong>Business Continuity:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>99.9% uptime SLA</li>
                  <li>Automatic failover capabilities</li>
                  <li>Disaster recovery procedures</li>
                  <li>Regular DR testing and validation</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Monitoring & Maintenance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Monitoring & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">System Monitoring</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Key Metrics to Monitor:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Azure AD sync success rate and timing</li>
                  <li>Signature deployment success rate</li>
                  <li>API response times and error rates</li>
                  <li>User login patterns and failures</li>
                  <li>System resource utilization</li>
                </ul>
                <p>
                  <strong>Alerting:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Failed Azure AD synchronizations</li>
                  <li>Exchange Online connection issues</li>
                  <li>High error rates or system downtime</li>
                  <li>Security incidents or suspicious activity</li>
                  <li>Certificate or secret expiration warnings</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Regular Maintenance Tasks</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Weekly Tasks:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Review system health dashboard</li>
                  <li>Check for failed deployments or sync errors</li>
                  <li>Monitor user activity and access patterns</li>
                  <li>Review security alerts and incidents</li>
                </ul>
                <p>
                  <strong>Monthly Tasks:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Review and update user permissions</li>
                  <li>Audit signature template usage</li>
                  <li>Check for software updates and patches</li>
                  <li>Review backup and recovery procedures</li>
                  <li>Update documentation and procedures</li>
                </ul>
                <p>
                  <strong>Quarterly Tasks:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Comprehensive security review</li>
                  <li>Performance optimization assessment</li>
                  <li>Disaster recovery testing</li>
                  <li>User training and awareness updates</li>
                  <li>Vendor and compliance reviews</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Support & Resources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Support & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Technical Support</h3>
                <ul className="space-y-1 text-sm">
                  <li>Priority support for administrators</li>
                  <li>24/7 emergency support for critical issues</li>
                  <li>Dedicated technical account manager</li>
                  <li>Remote assistance and screen sharing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Training & Resources</h3>
                <ul className="space-y-1 text-sm">
                  <li>Administrator certification program</li>
                  <li>Best practices webinars</li>
                  <li>Video tutorials and documentation</li>
                  <li>Community forums and knowledge base</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Emergency Contacts</h4>
              <div className="text-sm text-blue-800">
                <p>
                  <strong>Critical Issues:</strong> +1-800-SIGNIFY (24/7)
                </p>
                <p>
                  <strong>Security Incidents:</strong> security@signify.com
                </p>
                <p>
                  <strong>Technical Support:</strong> admin-support@signify.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-x-4">
          <Link href="/docs/user-guide" className="text-blue-600 hover:text-blue-800 underline">
            User Guide
          </Link>
          <Link href="/docs/api" className="text-blue-600 hover:text-blue-800 underline">
            API Documentation
          </Link>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
