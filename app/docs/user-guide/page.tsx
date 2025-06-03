import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, User, Settings, Mail, Shield } from "lucide-react"

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Guide</h1>
          <p className="mt-2 text-gray-600">Complete guide to using Signify Email Signature Platform</p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">For Organization Admins</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Log in to your organization dashboard</li>
                  <li>Set up Azure AD integration</li>
                  <li>Create signature templates</li>
                  <li>Assign signatures to users</li>
                  <li>Deploy via Exchange Online</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">For End Users</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Your admin will set up your signature</li>
                  <li>Signatures deploy automatically</li>
                  <li>Check your email client for the new signature</li>
                  <li>Contact your admin for changes</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Accessing Your Account</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Organization Login:</strong> Visit{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">yourorg.signify.com</code> or use the
                  organization-specific login link provided by your admin.
                </p>
                <p>
                  <strong>Credentials:</strong> Use the email address and password provided by your organization
                  administrator.
                </p>
                <p>
                  <strong>First Login:</strong> You may be prompted to change your password on first login for security.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Dashboard Overview</h3>
              <div className="space-y-3 text-gray-700">
                <p>Your dashboard provides an overview of:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Organization Status:</strong> Current user count, active templates, and Azure AD connection
                    status
                  </li>
                  <li>
                    <strong>Recent Activity:</strong> Latest signature deployments and user changes
                  </li>
                  <li>
                    <strong>Quick Actions:</strong> Common tasks like creating templates or syncing users
                  </li>
                  <li>
                    <strong>System Health:</strong> Service status and any important notifications
                  </li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Azure AD Integration</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Setup:</strong> Navigate to Settings → Azure AD to configure your tenant connection.
                </p>
                <p>
                  <strong>Required Information:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tenant ID (found in Azure Portal → Azure Active Directory → Properties)</li>
                  <li>Client ID (from your registered application)</li>
                  <li>Client Secret (generated for your application)</li>
                </ul>
                <p>
                  <strong>Permissions Required:</strong> User.Read.All, Group.Read.All, Directory.Read.All
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Syncing Users</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Automatic Sync:</strong> Configure automatic syncing (hourly, daily, or weekly) in Azure AD
                  settings.
                </p>
                <p>
                  <strong>Manual Sync:</strong> Click "Sync Now" in the Users section to immediately pull latest user
                  data.
                </p>
                <p>
                  <strong>Sync Options:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Include disabled users</li>
                  <li>Sync group memberships</li>
                  <li>Auto-provision new users</li>
                  <li>Auto-assign default signatures</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Managing Individual Users</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>View Users:</strong> Go to Users section to see all organization members.
                </p>
                <p>
                  <strong>User Actions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Edit user details (name, title, department, phone)</li>
                  <li>Assign specific signature templates</li>
                  <li>Enable/disable users</li>
                  <li>Reset passwords (for local accounts)</li>
                  <li>View signature deployment status</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Signature Templates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Signature Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Creating Templates</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Template Builder:</strong> Use our visual editor to design professional email signatures.
                </p>
                <p>
                  <strong>Dynamic Fields:</strong> Insert placeholders that automatically populate with user data:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <code className="text-sm">
                    {`{{name}} - User's full name`}
                    <br />
                    {`{{title}} - Job title`}
                    <br />
                    {`{{email}} - Email address`}
                    <br />
                    {`{{phone}} - Phone number`}
                    <br />
                    {`{{department}} - Department`}
                    <br />
                    {`{{company}} - Organization name`}
                    <br />
                    {`{{logo_url}} - Company logo`}
                  </code>
                </div>
                <p>
                  <strong>HTML Editor:</strong> Advanced users can edit HTML directly for custom styling.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Template Management</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Default Templates:</strong> Set one template as default for new users.
                </p>
                <p>
                  <strong>Template Actions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Edit existing templates</li>
                  <li>Duplicate templates for variations</li>
                  <li>Preview templates with sample data</li>
                  <li>Delete unused templates</li>
                  <li>Export templates for backup</li>
                </ul>
                <p>
                  <strong>Best Practices:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Keep signatures concise and professional</li>
                  <li>Use consistent branding and colors</li>
                  <li>Test templates across different email clients</li>
                  <li>Include essential contact information only</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Deployment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              Signature Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Assignment Methods</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Individual Assignment:</strong> Assign specific templates to individual users.
                </p>
                <p>
                  <strong>Bulk Assignment:</strong> Select multiple users and assign the same template.
                </p>
                <p>
                  <strong>Automatic Assignment:</strong> New users automatically receive the default template.
                </p>
                <p>
                  <strong>Department-Based:</strong> Assign different templates based on user departments.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Exchange Online Deployment</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Server-Side Deployment:</strong> Signatures are applied by Exchange transport rules.
                </p>
                <p>
                  <strong>Benefits:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Centrally managed and enforced</li>
                  <li>Works with all email clients</li>
                  <li>Users cannot modify or remove signatures</li>
                  <li>Consistent formatting across all emails</li>
                </ul>
                <p>
                  <strong>Deployment Options:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Deploy to all users in organization</li>
                  <li>Deploy to selected users only</li>
                  <li>Deploy to specific departments or groups</li>
                  <li>Test deployment with single user first</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Monitoring Deployments</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Deployment Status:</strong> Track the status of signature deployments in real-time.
                </p>
                <p>
                  <strong>Status Types:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <Badge variant="secondary">Pending</Badge> - Deployment queued
                  </li>
                  <li>
                    <Badge variant="default">In Progress</Badge> - Currently deploying
                  </li>
                  <li>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Success
                    </Badge>{" "}
                    - Successfully deployed
                  </li>
                  <li>
                    <Badge variant="destructive">Failed</Badge> - Deployment failed
                  </li>
                </ul>
                <p>
                  <strong>Troubleshooting:</strong> Check deployment logs for detailed error information if deployments
                  fail.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Security & Compliance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Security Best Practices</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Password Security:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use strong, unique passwords</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Change passwords regularly</li>
                  <li>Don't share account credentials</li>
                </ul>
                <p>
                  <strong>Access Control:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Limit admin access to necessary personnel only</li>
                  <li>Review user permissions regularly</li>
                  <li>Remove access for departed employees immediately</li>
                  <li>Use role-based access controls</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Data Protection</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Data Handling:</strong> All data is encrypted in transit and at rest using industry-standard
                  encryption.
                </p>
                <p>
                  <strong>Privacy:</strong> We comply with GDPR, CCPA, and other data protection regulations.
                </p>
                <p>
                  <strong>Backup:</strong> Regular backups ensure data recovery in case of incidents.
                </p>
                <p>
                  <strong>Audit Logs:</strong> All administrative actions are logged for security and compliance
                  purposes.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">Azure AD Connection Issues</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Problem:</strong> "Failed to connect to Azure AD"
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verify Tenant ID, Client ID, and Client Secret are correct</li>
                  <li>Ensure the Azure AD application has required permissions</li>
                  <li>Check that admin consent has been granted</li>
                  <li>Verify the application is not expired</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Signature Deployment Issues</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Problem:</strong> Signatures not appearing in emails
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check deployment status in the dashboard</li>
                  <li>Verify Exchange Online permissions</li>
                  <li>Ensure transport rules are enabled</li>
                  <li>Check if user's mailbox is in the correct organization</li>
                  <li>Wait up to 24 hours for changes to propagate</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-3">Template Display Issues</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Problem:</strong> Signature formatting looks incorrect
                </p>
                <p>
                  <strong>Solutions:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Test template in different email clients</li>
                  <li>Use table-based layouts for better compatibility</li>
                  <li>Avoid complex CSS that may not be supported</li>
                  <li>Keep image sizes reasonable (under 100KB)</li>
                  <li>Use web-safe fonts</li>
                </ul>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Getting Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Documentation</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/docs/admin-guide" className="text-blue-600 hover:underline">
                      Administrator Guide
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/api" className="text-blue-600 hover:underline">
                      API Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/troubleshooting" className="text-blue-600 hover:underline">
                      Troubleshooting Guide
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Support Channels</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    Email:{" "}
                    <a href="mailto:support@signify.com" className="text-blue-600 hover:underline">
                      support@signify.com
                    </a>
                  </li>
                  <li>Phone: 1-800-SIGNIFY</li>
                  <li>Live Chat: Available 9 AM - 5 PM EST</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-x-4">
          <Link href="/docs/admin-guide" className="text-blue-600 hover:text-blue-800 underline">
            Administrator Guide
          </Link>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
